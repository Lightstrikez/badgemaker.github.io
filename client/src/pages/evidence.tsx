import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import EvidenceModal from "@/components/badge/evidence-modal";
import { Badge, BadgeApplication, Evidence } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EVIDENCE_TYPE_LABELS } from "@/types";

// Mock user ID - in a real app this would come from auth context
const MOCK_USER_ID = "1";

export default function EvidencePage() {
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user applications with evidence
  const { data: applications = [] } = useQuery<(BadgeApplication & { badge: Badge; evidence: Evidence[] })[]>({
    queryKey: ['/api/users', MOCK_USER_ID, 'applications'],
  });

  // Fetch all badges for evidence modal
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ['/api/badges'],
  });

  // Flatten all evidence from all applications
  const allEvidence = applications.flatMap(app => 
    app.evidence.map(evidence => ({
      ...evidence,
      badge: app.badge,
      application: app
    }))
  );

  // Filter evidence based on search
  const filteredEvidence = allEvidence.filter(evidence =>
    evidence.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    evidence.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    evidence.badge.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Header 
        title="My Evidence" 
        description="Manage and review your submitted evidence"
        onSubmitEvidence={() => setIsEvidenceModalOpen(true)}
      />
      
      <div className="p-6 overflow-y-auto h-full">
        {/* Search */}
        <div className="mb-8">
          <Input
            placeholder="Search evidence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
            data-testid="input-search-evidence"
          />
        </div>

        {/* Evidence List */}
        {filteredEvidence.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-folder-open text-4xl text-muted-foreground mb-4"></i>
            <h3 className="text-lg font-medium mb-2">No evidence found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search criteria" : "Start by submitting evidence for your badge applications"}
            </p>
            <Button onClick={() => setIsEvidenceModalOpen(true)} data-testid="button-submit-first-evidence">
              Submit Evidence
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEvidence.map((evidence) => (
              <div key={evidence.id} className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2" data-testid={`evidence-title-${evidence.id}`}>
                      {evidence.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center space-x-1">
                        <i className="fas fa-medal"></i>
                        <span data-testid={`evidence-badge-${evidence.id}`}>{evidence.badge.name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <i className="fas fa-calendar"></i>
                        <span data-testid={`evidence-date-${evidence.id}`}>{formatDate(evidence.createdAt.toString())}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <i className="fas fa-file"></i>
                        <span data-testid={`evidence-type-${evidence.id}`}>{EVIDENCE_TYPE_LABELS[evidence.type]}</span>
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" data-testid={`button-edit-${evidence.id}`}>
                    <i className="fas fa-edit mr-2"></i>
                    Edit
                  </Button>
                </div>
                
                <p className="text-muted-foreground mb-4" data-testid={`evidence-description-${evidence.id}`}>
                  {evidence.description}
                </p>
                
                {evidence.content && (
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium mb-2">Written Reflection:</h4>
                    <p className="text-sm whitespace-pre-wrap" data-testid={`evidence-content-${evidence.id}`}>
                      {evidence.content}
                    </p>
                  </div>
                )}
                
                {evidence.fileUrl && (
                  <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                    <i className="fas fa-paperclip text-primary"></i>
                    <a 
                      href={evidence.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      data-testid={`evidence-file-${evidence.id}`}
                    >
                      View attached file
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        badges={badges}
      />
    </>
  );
}
