import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge, InsertEvidence } from "@shared/schema";
import { GRADUATE_PROFILE_LABELS, GRADUATE_PROFILE_ICONS } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EvidenceItem {
  id: string;
  type: 'file' | 'description';
  title: string;
  description: string;
  file?: File;
  fileUrl?: string;
}

interface SlideData {
  badgeId: string;
  badgeName: string;
  graduateProfile: string;
  evidence: EvidenceItem[];
  reflections: Record<string, string>;
}

type Step = 'landing' | 'badge-selection' | 'evidence-upload' | 'reflection' | 'slide-generation' | 'export';

const MOCK_USER_ID = "1";

export default function BadgeBuilder() {
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [slideData, setSlideData] = useState<SlideData | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all badges
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ['/api/badges'],
  });

  // Group badges by graduate profile
  const badgesByProfile = badges.reduce((acc, badge) => {
    if (!acc[badge.graduateProfile]) {
      acc[badge.graduateProfile] = [];
    }
    acc[badge.graduateProfile].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  const generateSlideMutation = useMutation({
    mutationFn: async (data: SlideData) => {
      const response = await apiRequest('POST', '/api/slides/generate', data);
      return response.json();
    },
    onSuccess: (data) => {
      setSlideData(data);
      setCurrentStep('export');
      toast({
        title: "Slides generated! ✨",
        description: "Your badge presentation is ready to download and share."
      });
    },
    onError: () => {
      toast({
        title: "Error generating slides",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  });

  const addEvidence = () => {
    if (evidence.length < 6) {
      setEvidence([...evidence, {
        id: Math.random().toString(36).substr(2, 9),
        type: 'description',
        title: '',
        description: ''
      }]);
    }
  };

  const updateEvidence = (id: string, updates: Partial<EvidenceItem>) => {
    setEvidence(evidence.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeEvidence = (id: string) => {
    setEvidence(evidence.filter(item => item.id !== id));
  };

  const handleGenerateSlides = () => {
    if (!selectedBadge) return;
    
    const data: SlideData = {
      badgeId: selectedBadge.id,
      badgeName: selectedBadge.name,
      graduateProfile: selectedBadge.graduateProfile,
      evidence,
      reflections
    };
    
    generateSlideMutation.mutate(data);
    setCurrentStep('slide-generation');
  };

  const resetBuilder = () => {
    setCurrentStep('landing');
    setSelectedBadge(null);
    setEvidence([]);
    setReflections({});
    setSlideData(null);
  };

  if (currentStep === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-medal text-3xl text-primary-foreground"></i>
            </div>
            <CardTitle className="text-4xl font-bold mb-2" data-testid="builder-title">
              OJC Badge Builder ✨
            </CardTitle>
            <p className="text-lg text-muted-foreground" data-testid="builder-description">
              Upload your evidence, choose a badge, and we'll help you create an awesome presentation!
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-upload text-primary text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2">Upload Evidence</h3>
                <p className="text-sm text-muted-foreground">Add your projects, photos, and achievements</p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-edit text-secondary text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2">Add Reflections</h3>
                <p className="text-sm text-muted-foreground">Write about your learning and growth</p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-presentation text-success text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2">Generate Slides</h3>
                <p className="text-sm text-muted-foreground">Get a professional presentation ready to share</p>
              </div>
            </div>
            <Button 
              onClick={() => setCurrentStep('badge-selection')} 
              size="lg" 
              className="text-lg px-8 py-4"
              data-testid="button-start-badge"
            >
              Start My Badge 🚀
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'badge-selection') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="badge-selection-title">Choose Your Badge</h1>
            <p className="text-muted-foreground">Select the Graduate Profile badge you want to apply for</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(GRADUATE_PROFILE_LABELS).map(([profile, label]) => {
              const profileBadges = badgesByProfile[profile] || [];
              
              return (
                <Card key={profile} className="overflow-hidden">
                  <CardHeader className={cn("text-center", `graduate-profile-${profile}`)}>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className={`${GRADUATE_PROFILE_ICONS[profile]} text-2xl text-white`}></i>
                    </div>
                    <CardTitle className="text-white">{label}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {profileBadges.map((badge) => (
                        <Button
                          key={badge.id}
                          variant="outline"
                          className="w-full justify-start text-left h-auto p-3"
                          onClick={() => {
                            setSelectedBadge(badge);
                            setCurrentStep('evidence-upload');
                          }}
                          data-testid={`select-badge-${badge.id}`}
                        >
                          <div>
                            <div className="font-medium">{badge.name}</div>
                            <div className="text-xs text-muted-foreground">Level {badge.level}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" onClick={resetBuilder} data-testid="button-back-to-start">
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Start
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'evidence-upload') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="evidence-upload-title">
              Upload Your Evidence ✨
            </h1>
            <p className="text-muted-foreground">
              Add up to 6 pieces of evidence for <strong>{selectedBadge?.name}</strong>
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Badge Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{selectedBadge?.criteria}</p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {evidence.map((item, index) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Evidence {index + 1}</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeEvidence(item.id)}
                      data-testid={`remove-evidence-${item.id}`}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={item.type === 'description' ? 'default' : 'outline'}
                      onClick={() => updateEvidence(item.id, { type: 'description' })}
                      className="h-auto p-4"
                      data-testid={`evidence-type-description-${item.id}`}
                    >
                      <div className="text-center">
                        <i className="fas fa-file-alt text-xl mb-2"></i>
                        <div className="font-medium">Description</div>
                        <div className="text-xs opacity-75">Write about your work</div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={item.type === 'file' ? 'default' : 'outline'}
                      onClick={() => updateEvidence(item.id, { type: 'file' })}
                      className="h-auto p-4"
                      data-testid={`evidence-type-file-${item.id}`}
                    >
                      <div className="text-center">
                        <i className="fas fa-upload text-xl mb-2"></i>
                        <div className="font-medium">File Upload</div>
                        <div className="text-xs opacity-75">Photos, videos, documents</div>
                      </div>
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor={`title-${item.id}`}>Evidence Title</Label>
                    <Input
                      id={`title-${item.id}`}
                      value={item.title}
                      onChange={(e) => updateEvidence(item.id, { title: e.target.value })}
                      placeholder="Give your evidence a catchy title"
                      data-testid={`evidence-title-${item.id}`}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`description-${item.id}`}>Description</Label>
                    <Textarea
                      id={`description-${item.id}`}
                      value={item.description}
                      onChange={(e) => updateEvidence(item.id, { description: e.target.value })}
                      placeholder="Describe your evidence and how it shows your growth..."
                      rows={3}
                      data-testid={`evidence-description-${item.id}`}
                    />
                  </div>

                  {item.type === 'file' && (
                    <div>
                      <Label htmlFor={`file-${item.id}`}>Upload File</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <i className="fas fa-cloud-upload-alt text-3xl text-muted-foreground mb-3"></i>
                        <div className="font-medium mb-2">Drop files here or click to upload</div>
                        <div className="text-sm text-muted-foreground mb-3">
                          Images, videos, documents (max 10MB)
                        </div>
                        <Input
                          id={`file-${item.id}`}
                          type="file"
                          onChange={(e) => updateEvidence(item.id, { file: e.target.files?.[0] })}
                          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                          data-testid={`evidence-file-${item.id}`}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {evidence.length < 6 && (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Button onClick={addEvidence} variant="outline" data-testid="button-add-evidence">
                    <i className="fas fa-plus mr-2"></i>
                    Add Evidence ({evidence.length}/6)
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setCurrentStep('badge-selection')}>
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Badge Selection
            </Button>
            <Button 
              onClick={() => setCurrentStep('reflection')} 
              disabled={evidence.length === 0}
              data-testid="button-continue-to-reflection"
            >
              Continue to Reflections
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'reflection') {
    const reflectionPrompts = [
      {
        id: 'learning',
        question: 'What did you learn through this experience?',
        placeholder: 'Describe the key skills, knowledge, or insights you gained...'
      },
      {
        id: 'growth',
        question: 'How does this show your personal growth?',
        placeholder: 'Explain how you developed or improved in this area...'
      },
      {
        id: 'connection',
        question: `How does this connect to ${GRADUATE_PROFILE_LABELS[selectedBadge?.graduateProfile || 'excellence']}?`,
        placeholder: 'Make the connection between your evidence and this Graduate Profile value...'
      },
      {
        id: 'impact',
        question: 'What impact did this have on you or others?',
        placeholder: 'Describe the positive effects or changes that resulted...'
      }
    ];

    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="reflection-title">
              Reflect on Your Journey 💭
            </h1>
            <p className="text-muted-foreground">
              Share your thoughts about the learning and growth you've experienced
            </p>
          </div>

          <div className="space-y-6">
            {reflectionPrompts.map((prompt) => (
              <Card key={prompt.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{prompt.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={reflections[prompt.id] || ''}
                    onChange={(e) => setReflections(prev => ({
                      ...prev,
                      [prompt.id]: e.target.value
                    }))}
                    placeholder={prompt.placeholder}
                    rows={4}
                    data-testid={`reflection-${prompt.id}`}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setCurrentStep('evidence-upload')}>
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Evidence
            </Button>
            <Button 
              onClick={handleGenerateSlides}
              disabled={Object.keys(reflections).length === 0}
              data-testid="button-generate-slides"
            >
              Generate My Slides ✨
              <i className="fas fa-magic ml-2"></i>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'slide-generation') {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-magic text-3xl text-primary animate-pulse"></i>
            </div>
            <h2 className="text-2xl font-bold mb-4">Creating Your Slides ✨</h2>
            <p className="text-muted-foreground mb-6">
              We're building your awesome badge presentation. This won't take long!
            </p>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'export') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="export-title">
              Your Presentation is Ready! 🎉
            </h1>
            <p className="text-muted-foreground">
              Download your slides or share them with your teachers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Download Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" data-testid="download-pptx">
                  <i className="fas fa-file-powerpoint mr-3 text-orange-500"></i>
                  Download PowerPoint (.pptx)
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="download-pdf">
                  <i className="fas fa-file-pdf mr-3 text-red-500"></i>
                  Download PDF
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="view-online">
                  <i className="fas fa-eye mr-3 text-blue-500"></i>
                  View Online Presentation
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Share & Save</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" data-testid="share-teacher">
                  <i className="fas fa-share mr-3 text-green-500"></i>
                  Share with Teacher
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="save-draft">
                  <i className="fas fa-save mr-3 text-purple-500"></i>
                  Save as Draft
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="copy-link">
                  <i className="fas fa-link mr-3 text-cyan-500"></i>
                  Copy Share Link
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted/50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold mb-4">Preview: Your Slide Deck</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card p-3 rounded border">
                <div className="aspect-video bg-primary/10 rounded mb-2 flex items-center justify-center">
                  <i className="fas fa-medal text-primary text-2xl"></i>
                </div>
                <div className="text-xs text-center">Title Slide</div>
              </div>
              {evidence.slice(0, 3).map((_, index) => (
                <div key={index} className="bg-card p-3 rounded border">
                  <div className="aspect-video bg-muted rounded mb-2 flex items-center justify-center">
                    <i className="fas fa-image text-muted-foreground"></i>
                  </div>
                  <div className="text-xs text-center">Evidence {index + 1}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={resetBuilder} data-testid="button-start-new">
              <i className="fas fa-plus mr-2"></i>
              Start New Badge
            </Button>
            <Button onClick={() => setCurrentStep('landing')} data-testid="button-back-home">
              <i className="fas fa-home mr-2"></i>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}