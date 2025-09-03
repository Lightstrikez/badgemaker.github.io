import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  badges: Badge[];
  selectedBadgeId?: string;
  applicationId?: string;
}

export default function EvidenceModal({ 
  isOpen, 
  onClose, 
  badges, 
  selectedBadgeId,
  applicationId 
}: EvidenceModalProps) {
  const [formData, setFormData] = useState({
    badgeId: selectedBadgeId || '',
    type: 'written_reflection',
    title: '',
    description: '',
    content: '',
    file: null as File | null
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitEvidenceMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/api/evidence', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Evidence submitted successfully",
        description: "Your evidence has been added to the application."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error submitting evidence",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      badgeId: selectedBadgeId || '',
      type: 'written_reflection',
      title: '',
      description: '',
      content: '',
      file: null
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicationId) {
      toast({
        title: "Error",
        description: "No application selected.",
        variant: "destructive"
      });
      return;
    }

    const formDataToSubmit = new FormData();
    formDataToSubmit.append('applicationId', applicationId);
    formDataToSubmit.append('type', formData.type);
    formDataToSubmit.append('title', formData.title);
    formDataToSubmit.append('description', formData.description);
    
    if (formData.type === 'written_reflection' && formData.content) {
      formDataToSubmit.append('content', formData.content);
    }
    
    if (formData.file) {
      formDataToSubmit.append('file', formData.file);
    }

    submitEvidenceMutation.mutate(formDataToSubmit);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="evidence-modal-title">Submit Evidence</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="badge-select">Select Badge</Label>
            <Select 
              value={formData.badgeId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, badgeId: value }))}
              disabled={!!selectedBadgeId}
            >
              <SelectTrigger data-testid="select-badge">
                <SelectValue placeholder="Choose a badge" />
              </SelectTrigger>
              <SelectContent>
                {badges.map((badge) => (
                  <SelectItem key={badge.id} value={badge.id}>
                    {badge.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="evidence-type">Evidence Type</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'written_reflection' }))}
                className={`p-4 border border-border rounded-lg text-left hover:bg-muted transition-colors ${
                  formData.type === 'written_reflection' ? 'bg-accent' : ''
                }`}
                data-testid="button-written-reflection"
              >
                <i className="fas fa-file-alt text-primary mb-2"></i>
                <div className="font-medium">Written Reflection</div>
                <div className="text-sm text-muted-foreground">Document your learning journey</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'file_upload' }))}
                className={`p-4 border border-border rounded-lg text-left hover:bg-muted transition-colors ${
                  formData.type === 'file_upload' ? 'bg-accent' : ''
                }`}
                data-testid="button-file-upload"
              >
                <i className="fas fa-upload text-primary mb-2"></i>
                <div className="font-medium">File Upload</div>
                <div className="text-sm text-muted-foreground">Photos, videos, documents</div>
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Evidence Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Give your evidence a descriptive title"
              required
              data-testid="input-title"
            />
          </div>

          <div>
            <Label htmlFor="description">Evidence Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your evidence and how it demonstrates the badge criteria..."
              rows={4}
              required
              data-testid="textarea-description"
            />
          </div>

          {formData.type === 'written_reflection' && (
            <div>
              <Label htmlFor="content">Written Reflection</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your reflection here..."
                rows={6}
                data-testid="textarea-content"
              />
            </div>
          )}

          {formData.type === 'file_upload' && (
            <div>
              <Label htmlFor="file">Upload File</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-4"></i>
                <div className="font-medium mb-2">Drop files here or click to upload</div>
                <div className="text-sm text-muted-foreground">Supports images, videos, documents (max 10MB)</div>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  className="mt-4"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  data-testid="input-file"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitEvidenceMutation.isPending}
              data-testid="button-submit-evidence"
            >
              {submitEvidenceMutation.isPending ? "Submitting..." : "Submit Evidence"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
