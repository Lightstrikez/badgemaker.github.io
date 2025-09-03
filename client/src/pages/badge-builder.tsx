import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge, InsertEvidence } from "@shared/schema";
import { GRADUATE_PROFILE_LABELS, GRADUATE_PROFILE_ICONS } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EvidenceItem {
  id: string;
  type: 'photos' | 'reflections' | 'interviews' | 'iterations' | 'prototypes' | 'videos' | 'awards' | 'charts' | 'work' | 'audio' | 'mistakes' | 'process' | 'witnesses' | 'feedback' | 'other';
  title: string;
  description: string;
  file?: File;
  fileUrl?: string;
  source?: 'MAC' | 'LIT' | 'NUM' | 'TAIP' | 'WO' | 'Clubs' | 'Outside OJC';
}

interface SlideData {
  badgeId: string;
  badgeName: string;
  graduateProfile: string;
  evidence: EvidenceItem[];
  reflections: Record<string, string>;
}

type Step = 'landing' | 'year-level' | 'badge-selection' | 'evidence-upload' | 'reflection' | 'panel-prep' | 'slide-generation' | 'export';

type YearLevel = 'junior' | 'senior';

const MOCK_USER_ID = "1";

// Official OJC evidence types from the feedback form
const EVIDENCE_TYPES = [
  { value: 'photos', label: 'Photos', icon: 'fas fa-camera' },
  { value: 'reflections', label: 'Reflections', icon: 'fas fa-edit' },
  { value: 'interviews', label: 'Interviews', icon: 'fas fa-microphone' },
  { value: 'iterations', label: 'Iterations', icon: 'fas fa-redo' },
  { value: 'prototypes', label: 'Prototypes', icon: 'fas fa-cubes' },
  { value: 'videos', label: 'Videos', icon: 'fas fa-video' },
  { value: 'awards', label: 'Awards', icon: 'fas fa-trophy' },
  { value: 'charts', label: 'Charts/Graphs', icon: 'fas fa-chart-bar' },
  { value: 'work', label: 'Work', icon: 'fas fa-file-alt' },
  { value: 'audio', label: 'Audio', icon: 'fas fa-volume-up' },
  { value: 'mistakes', label: 'Mistakes/Retakes', icon: 'fas fa-exclamation-triangle' },
  { value: 'process', label: 'Process/Steps', icon: 'fas fa-list-ol' },
  { value: 'witnesses', label: 'Witnesses', icon: 'fas fa-users' },
  { value: 'feedback', label: 'Feedback', icon: 'fas fa-comments' },
  { value: 'other', label: 'Other', icon: 'fas fa-plus-circle' }
] as const;

const EVIDENCE_SOURCES = [
  { value: 'MAC', label: 'MAC (Maths, Arts, Creativity)' },
  { value: 'LIT', label: 'LIT (Literacy)' },
  { value: 'NUM', label: 'NUM (Numeracy)' },
  { value: 'TAIP', label: 'TAIP (Te Aotearoa i te Pakihi)' },
  { value: 'WO', label: 'WO (World of Work)' },
  { value: 'Clubs', label: 'Clubs' },
  { value: 'Outside OJC', label: 'Experience outside of OJC' }
] as const;

export default function BadgeBuilder() {
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [yearLevel, setYearLevel] = useState<YearLevel | null>(null);
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

  // Filter badges by year level and group by graduate profile
  const filteredBadges = badges.filter(badge => {
    if (!yearLevel) return true;
    return yearLevel === 'junior' ? badge.name.includes('Junior') : badge.name.includes('Senior');
  });

  const badgesByProfile = filteredBadges.reduce((acc, badge) => {
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
        type: 'reflections',
        title: '',
        description: '',
        source: 'MAC'
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
    setYearLevel(null);
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
              Time to showcase your learning! Let's build your badge portfolio together 🚀
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-search text-primary text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2">Find Your Evidence</h3>
                <p className="text-sm text-muted-foreground">Look through your Google folders, camera roll, and projects</p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-lightbulb text-secondary text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2">Reflect & Connect</h3>
                <p className="text-sm text-muted-foreground">Show what you learned and how you grew</p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-presentation text-success text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2">Present & Celebrate</h3>
                <p className="text-sm text-muted-foreground">Get ready to pitch to the badge panel</p>
              </div>
            </div>
            <Button 
              onClick={() => setCurrentStep('year-level')} 
              size="lg" 
              className="text-lg px-8 py-4"
              data-testid="button-start-badge"
            >
              Let's Do This! 🎯
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'year-level') {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2" data-testid="year-level-title">
              What year are you in?
            </CardTitle>
            <p className="text-muted-foreground">
              This helps us show you the right badges for your level
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant={yearLevel === 'junior' ? 'default' : 'outline'}
              className="w-full h-auto p-6"
              onClick={() => setYearLevel('junior')}
              data-testid="select-junior"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🌱</div>
                <div className="font-semibold text-lg">Junior (Year 7-8)</div>
                <div className="text-sm opacity-75">Building your foundation</div>
              </div>
            </Button>
            <Button
              variant={yearLevel === 'senior' ? 'default' : 'outline'}
              className="w-full h-auto p-6"
              onClick={() => setYearLevel('senior')}
              data-testid="select-senior"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🚀</div>
                <div className="font-semibold text-lg">Senior (Year 9-10)</div>
                <div className="text-sm opacity-75">Taking it to the next level</div>
              </div>
            </Button>
            
            {yearLevel && (
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={resetBuilder}>
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep('badge-selection')}
                  data-testid="button-continue-to-badges"
                >
                  Show Me My Badges
                  <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
            )}
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
            <h1 className="text-3xl font-bold mb-2" data-testid="badge-selection-title">
              Choose Your Badge ({yearLevel === 'junior' ? 'Junior' : 'Senior'} Level)
            </h1>
            <p className="text-muted-foreground">
              Pick the Graduate Profile badge that matches your evidence best
            </p>
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
                            <div className="font-medium">{badge.name.replace(' Junior', '').replace(' Senior', '')}</div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{badge.description}</div>
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
            <Button variant="outline" onClick={() => setCurrentStep('year-level')} data-testid="button-back-to-year">
              <i className="fas fa-arrow-left mr-2"></i>
              Change Year Level
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
              Show Your Evidence 📁
            </h1>
            <p className="text-muted-foreground">
              Add up to 6 pieces of evidence for <strong>{selectedBadge?.name}</strong>
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What the badge panel is looking for:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-line">{selectedBadge?.criteria}</div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`type-${item.id}`}>Evidence Type</Label>
                      <Select
                        value={item.type}
                        onValueChange={(value) => updateEvidence(item.id, { type: value as any })}
                      >
                        <SelectTrigger data-testid={`evidence-type-${item.id}`}>
                          <SelectValue placeholder="Choose evidence type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EVIDENCE_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <i className={type.icon}></i>
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`source-${item.id}`}>Where's this from?</Label>
                      <Select
                        value={item.source}
                        onValueChange={(value) => updateEvidence(item.id, { source: value as any })}
                      >
                        <SelectTrigger data-testid={`evidence-source-${item.id}`}>
                          <SelectValue placeholder="Choose source" />
                        </SelectTrigger>
                        <SelectContent>
                          {EVIDENCE_SOURCES.map(source => (
                            <SelectItem key={source.value} value={source.value}>
                              {source.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`title-${item.id}`}>Give it a catchy title</Label>
                    <Input
                      id={`title-${item.id}`}
                      value={item.title}
                      onChange={(e) => updateEvidence(item.id, { title: e.target.value })}
                      placeholder="e.g., 'My epic science fair project'"
                      data-testid={`evidence-title-${item.id}`}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`description-${item.id}`}>Describe your evidence</Label>
                    <Textarea
                      id={`description-${item.id}`}
                      value={item.description}
                      onChange={(e) => updateEvidence(item.id, { description: e.target.value })}
                      placeholder="What is it? When did you do it? Why is it awesome evidence for this badge?"
                      rows={3}
                      data-testid={`evidence-description-${item.id}`}
                    />
                  </div>

                  {['photos', 'videos', 'audio', 'work', 'charts'].includes(item.type) && (
                    <div>
                      <Label htmlFor={`file-${item.id}`}>Upload File (Optional)</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <i className="fas fa-cloud-upload-alt text-3xl text-muted-foreground mb-3"></i>
                        <div className="font-medium mb-2">Drop files here or click to upload</div>
                        <div className="text-sm text-muted-foreground mb-3">
                          Max 10MB - or just describe where it's saved!
                        </div>
                        <Input
                          id={`file-${item.id}`}
                          type="file"
                          onChange={(e) => updateEvidence(item.id, { file: e.target.files?.[0] })}
                          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
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
                    Add More Evidence ({evidence.length}/6)
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Quality over quantity - even 3-4 strong pieces of evidence can win badges!
                  </p>
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
              Now Let's Reflect
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
        question: 'What did you actually learn through this?',
        placeholder: 'Think beyond just completing it - what skills, knowledge, or insights did you gain?',
        hint: 'E.g., "At first I didn\'t know how to..., but I learned that..."'
      },
      {
        id: 'growth',
        question: 'How does this show you\'ve grown as a learner?',
        placeholder: 'What\'s different about you now compared to before?',
        hint: 'E.g., "This pushed me because... and now I can..."'
      },
      {
        id: 'connection',
        question: `How does this connect to ${GRADUATE_PROFILE_LABELS[selectedBadge?.graduateProfile || 'excellence']}?`,
        placeholder: 'Make a clear connection between your evidence and this Graduate Profile value',
        hint: 'Be specific about which parts of your evidence show this value'
      },
      {
        id: 'application',
        question: 'When have you used these skills in other situations?',
        placeholder: 'How have you applied what you learned in different contexts?',
        hint: 'Think about other subjects, outside school, or future situations'
      }
    ];

    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="reflection-title">
              Time to Reflect 🤔
            </h1>
            <p className="text-muted-foreground">
              This is where you show the panel what you actually learned (not just what you did!)
            </p>
          </div>

          <div className="space-y-6">
            {reflectionPrompts.map((prompt) => (
              <Card key={prompt.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{prompt.question}</CardTitle>
                  <p className="text-sm text-muted-foreground">{prompt.hint}</p>
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
              onClick={() => setCurrentStep('panel-prep')}
              disabled={Object.keys(reflections).length === 0}
              data-testid="button-continue-to-panel-prep"
            >
              Prep for Panel
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'panel-prep') {
    const panelQuestions = [
      "Why did you choose this badge?",
      "When have you applied this criteria in other situations? What does it look like in practice?",
      "How do you use these skills in 'real life'?",
      "Have you ever taught anyone this skill/knowledge?",
      "What other ways could you collect evidence to show you have met this criteria?",
      "What evidence have you got here that could be used for another badge?",
      "What next steps could you take in order to level up in this badge?",
      "Can you show me/us...? (live evidence)"
    ];

    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="panel-prep-title">
              Get Ready for the Panel! 🎤
            </h1>
            <p className="text-muted-foreground">
              Here are the questions they might ask - practice your answers!
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quick Tips for Your Badge Pitch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">✓ DO</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Be genuine and honest</li>
                    <li>• Show your evidence clearly</li>
                    <li>• Explain what you learned</li>
                    <li>• Ask for help if you need it</li>
                    <li>• Practice with family/friends</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">✗ DON'T</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Make things up</li>
                    <li>• Just show photos without explaining</li>
                    <li>• Bring everything you've ever done</li>
                    <li>• Be scared - they want you to succeed!</li>
                    <li>• Forget to reflect on your learning</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Questions They Might Ask</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {panelQuestions.map((question, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{question}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your 2-Minute Pitch Outline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">1. Intro (15 seconds)</h4>
                  <p className="text-sm text-muted-foreground">"Hi, I'm [name] and I'm here to pitch for [badge name] because..."</p>
                </div>
                <div>
                  <h4 className="font-semibold">2. Evidence walkthrough (60 seconds)</h4>
                  <p className="text-sm text-muted-foreground">Show your best 3-4 pieces of evidence and explain how each one proves the criteria</p>
                </div>
                <div>
                  <h4 className="font-semibold">3. Reflection (30 seconds)</h4>
                  <p className="text-sm text-muted-foreground">What you learned and how you've grown</p>
                </div>
                <div>
                  <h4 className="font-semibold">4. Wrap up (15 seconds)</h4>
                  <p className="text-sm text-muted-foreground">"That's why I believe I've earned this badge. Any questions?"</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setCurrentStep('reflection')}>
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Reflections
            </Button>
            <Button 
              onClick={handleGenerateSlides}
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
            <h2 className="text-2xl font-bold mb-4">Creating Your Badge Presentation ✨</h2>
            <p className="text-muted-foreground mb-6">
              We're building your slides with all your evidence and reflections. Almost done!
            </p>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
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
              Your Badge Presentation is Ready! 🎉
            </h1>
            <p className="text-muted-foreground">
              Time to download, practice, and book your badge panel!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Download Your Presentation</CardTitle>
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
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" data-testid="book-panel">
                  <i className="fas fa-calendar mr-3 text-green-500"></i>
                  Book Badge Panel Slot
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="share-teacher">
                  <i className="fas fa-share mr-3 text-purple-500"></i>
                  Share with Teacher
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="save-draft">
                  <i className="fas fa-save mr-3 text-cyan-500"></i>
                  Save as Draft
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Presentation Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-4 rounded-lg text-center">
                  <div className="aspect-video bg-primary/20 rounded mb-2 flex items-center justify-center">
                    <i className="fas fa-medal text-primary text-xl"></i>
                  </div>
                  <div className="text-xs font-medium">Title Slide</div>
                  <div className="text-xs text-muted-foreground">{selectedBadge?.name}</div>
                </div>
                {evidence.slice(0, 3).map((item, index) => (
                  <div key={index} className="bg-muted/50 p-4 rounded-lg text-center">
                    <div className="aspect-video bg-muted rounded mb-2 flex items-center justify-center">
                      <i className={`${EVIDENCE_TYPES.find(t => t.value === item.type)?.icon} text-muted-foreground`}></i>
                    </div>
                    <div className="text-xs font-medium">Evidence {index + 1}</div>
                    <div className="text-xs text-muted-foreground truncate">{item.title || 'Untitled'}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-3">🎯 Final Badge Panel Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Before your panel:</h4>
                  <ul className="space-y-1">
                    <li>□ Practice your 2-minute pitch</li>
                    <li>□ Print or save your slides</li>
                    <li>□ Prepare your physical evidence</li>
                    <li>□ Think about panel questions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Bring to the panel:</h4>
                  <ul className="space-y-1">
                    <li>□ Your slides/portfolio</li>
                    <li>□ Physical evidence (if any)</li>
                    <li>□ A positive attitude</li>
                    <li>□ Confidence in your learning!</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={resetBuilder} data-testid="button-start-new">
              <i className="fas fa-plus mr-2"></i>
              Start Another Badge
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