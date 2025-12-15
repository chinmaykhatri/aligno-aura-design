import { useState, useRef, useEffect, useCallback } from 'react';
import { useProjectMessages, useSendMessage, useDeleteMessage, useUploadAttachment, ProjectMessage, getAttachmentSignedUrl } from '@/hooks/useProjectMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MessageSquare, Send, MoreVertical, Trash2, Loader2, Paperclip, X, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageLightbox from '@/components/ImageLightbox';

interface ProjectChatProps {
  projectId: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const ProjectChat = ({ projectId }: ProjectChatProps) => {
  const [message, setMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | undefined>(undefined);
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: messages, isLoading } = useProjectMessages(projectId);
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const uploadAttachment = useUploadAttachment();
  const { typingUsers, setTyping } = useTypingIndicator(projectId, currentUserId || undefined, currentUserName);

  // Fetch signed URLs for attachments
  const fetchSignedUrls = useCallback(async (msgs: ProjectMessage[]) => {
    const attachmentMsgs = msgs.filter(m => m.attachment_url && !signedUrls[m.id]);
    
    for (const msg of attachmentMsgs) {
      if (msg.attachment_url) {
        const signedUrl = await getAttachmentSignedUrl(msg.attachment_url);
        if (signedUrl) {
          setSignedUrls(prev => ({ ...prev, [msg.id]: signedUrl }));
        }
      }
    }
  }, [signedUrls]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      fetchSignedUrls(messages);
    }
  }, [messages, fetchSignedUrls]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        setCurrentUserName(profile?.full_name || 'User');
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only images, PDFs, and documents are allowed',
        variant: 'destructive',
      });
      return;
    }

    try {
      const attachment = await uploadAttachment.mutateAsync({ projectId, file });
      setPendingAttachment(attachment);
      toast({
        title: 'File uploaded',
        description: 'Ready to send with your message',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !pendingAttachment) return;

    try {
      await sendMessage.mutateAsync({
        projectId,
        content: message || (pendingAttachment ? `Shared: ${pendingAttachment.name}` : ''),
        attachment: pendingAttachment || undefined,
      });
      setMessage('');
      setPendingAttachment(null);
      setTyping(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage.mutateAsync({ messageId, projectId });
      toast({
        title: 'Message deleted',
        description: 'Your message has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isImageType = (type: string | null | undefined) => {
    return type?.startsWith('image/');
  };

  const renderAttachment = (msg: ProjectMessage) => {
    if (!msg.attachment_url) return null;

    // Use signed URL from cache, or fall back to stored URL
    const displayUrl = signedUrls[msg.id] || msg.attachment_url;

    if (isImageType(msg.attachment_type)) {
      return (
        <button
          onClick={() => setLightboxImage({ src: displayUrl, alt: msg.attachment_name || 'Image' })}
          className="block mt-2 cursor-zoom-in"
        >
          <img
            src={displayUrl}
            alt={msg.attachment_name || 'Attachment'}
            className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-border/50 hover:opacity-90 transition-opacity"
          />
        </button>
      );
    }

    return (
      <a
        href={displayUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-background/50 border border-border/50 hover:bg-background/80 transition-colors max-w-[200px]"
      >
        <FileText className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-xs truncate">{msg.attachment_name}</span>
        <Download className="h-3 w-3 shrink-0 text-muted-foreground" />
      </a>
    );
  };

  const renderMessage = (msg: ProjectMessage) => {
    const isOwn = msg.user_id === currentUserId;
    const profile = msg.profile;

    return (
      <div
        key={msg.id}
        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {getInitials(profile?.full_name || null)}
          </AvatarFallback>
        </Avatar>

        <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">
              {profile?.full_name || 'Unknown User'}
            </span>
            <span className="text-xs text-muted-foreground/60">
              {format(new Date(msg.created_at), 'HH:mm')}
            </span>
          </div>

          <div className="flex items-start gap-1 group">
            <div
              className={`px-3 py-2 rounded-2xl text-sm ${
                isOwn
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
              }`}
            >
              {msg.content}
              {renderAttachment(msg)}
            </div>

            {isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleDelete(msg.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Team Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[300px] pr-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map(renderMessage)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          )}
        </ScrollArea>

        {/* Pending attachment preview */}
        {pendingAttachment && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
            {isImageType(pendingAttachment.type) ? (
              <ImageIcon className="h-4 w-4 text-primary" />
            ) : (
              <FileText className="h-4 w-4 text-primary" />
            )}
            <span className="text-sm flex-1 truncate">{pendingAttachment.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setPendingAttachment(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0].name} is typing...`
                : `${typingUsers.map(u => u.name).join(', ')} are typing...`}
            </span>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAttachment.isPending}
          >
            {uploadAttachment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
          <Input
            value={message}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 bg-background/50"
            disabled={sendMessage.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={(!message.trim() && !pendingAttachment) || sendMessage.isPending}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>

      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </Card>
  );
};

export default ProjectChat;
