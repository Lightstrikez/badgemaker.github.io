import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import BadgeCard from "@/components/badge/badge-card";
import EvidenceModal from "@/components/badge/evidence-modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge, BadgeApplication } from "@shared/schema";
import { GRADUATE_PROFILE_LABELS } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Mock user ID - in a real app this would come from auth context
const MOCK_USER_ID = "1";

export default function BadgeCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<string>("all");
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all badges
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ['/api/badges'],
  });

  // Fetch user applications
  const { data: applications = [] } = useQuery<(BadgeApplication & { badge: Badge; evidence: any[] })[]>({
    queryKey: ['/api/users', MOCK_USER_ID, 'applications'],
  });

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async (data: { userId: string; badgeId: string }) => {
      const response = await apiRequest('POST', '/api/applications', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application started",
        description: "You can now submit evidence for this badge."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: () => {
      toast({
        title: "Error starting application",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Filter badges based on search and profile
  const filteredBadges = badges.filter(badge => {
    const matchesSearch = badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         badge.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProfile = selectedProfile === "all" || badge.graduateProfile === selectedProfile;
    return matchesSearch && matchesProfile;
  });

  // Create a map of applications by badge ID
  const applicationsByBadgeId = applications.reduce((acc, app) => {
    acc[app.badgeId] = app;
    return acc;
  }, {} as Record<string, BadgeApplication & { badge: Badge; evidence: any[] }>);

  const handleStartApplication = (badgeId: string) => {
    createApplicationMutation.mutate({
      userId: MOCK_USER_ID,
      badgeId
    });
  };

  const handleSubmitEvidence = (badgeId: string) => {
    setSelectedBadgeId(badgeId);
    setIsEvidenceModalOpen(true);
  };

  return (
    <>
      <Header 
        title="Badge Catalog" 
        description="Explore and apply for Graduate Profile badges"
        onSubmitEvidence={() => setIsEvidenceModalOpen(true)}
      />
      
      <div className="p-6 overflow-y-auto h-full">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search badges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              data-testid="input-search-badges"
            />
          </div>
          <Select value={selectedProfile} onValueChange={setSelectedProfile}>
            <SelectTrigger className="sm:w-64" data-testid="select-profile-filter">
              <SelectValue placeholder="Filter by Graduate Profile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Profiles</SelectItem>
              {Object.entries(GRADUATE_PROFILE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Badge Grid */}
        {filteredBadges.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-search text-4xl text-muted-foreground mb-4"></i>
            <h3 className="text-lg font-medium mb-2">No badges found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBadges.map((badge) => {
              const application = applicationsByBadgeId[badge.id];
              return (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  application={application}
                  onStartApplication={() => handleStartApplication(badge.id)}
                  onContinueApplication={() => handleSubmitEvidence(badge.id)}
                  onViewApplication={() => console.log('View application:', application?.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => {
          setIsEvidenceModalOpen(false);
          setSelectedBadgeId("");
        }}
        badges={badges}
        selectedBadgeId={selectedBadgeId}
        applicationId={selectedBadgeId ? applicationsByBadgeId[selectedBadgeId]?.id : undefined}
      />
    </>
  );
}
