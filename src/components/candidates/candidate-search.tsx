'use client';

// @ts-ignore - React hooks import issue
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore - Lucide icons import issue
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface SearchFilters {
  searchTerm: string;
  location: string;
  skills: string[];
  minAge?: number;
  maxAge?: number;
  availability?: string;
  interests: string[];
}

interface CandidateSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

export function CandidateSearch({ onSearch }: CandidateSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [skillInput, setSkillInput] = useState<string>('');
  const [skills, setSkills] = useState<string[]>([]);
  const [minAge, setMinAge] = useState<number | undefined>(undefined);
  const [maxAge, setMaxAge] = useState<number | undefined>(undefined);
  const [availability, setAvailability] = useState<string>('');
  const [interestInput, setInterestInput] = useState<string>('');
  const [interests, setInterests] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleAddInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleSearch = () => {
    onSearch({
      searchTerm,
      location,
      skills,
      minAge,
      maxAge,
      availability,
      interests,
    });
  };

  const handleReset = () => {
    setSearchTerm('');
    setLocation('');
    setSkills([]);
    setMinAge(undefined);
    setMaxAge(undefined);
    setAvailability('');
    setInterests([]);
    onSearch({
      searchTerm: '',
      location: '',
      skills: [],
      interests: [],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Candidates
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </CardTitle>
        <CardDescription>Find the perfect candidate for your team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search by name, skills, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Location */}
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Skills */}
            <div>
              <Label>Skills</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                />
                <Button type="button" variant="outline" onClick={handleAddSkill}>
                  Add
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Age Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minAge">Min Age</Label>
                <Input
                  id="minAge"
                  type="number"
                  placeholder="18"
                  value={minAge || ''}
                  onChange={(e) => setMinAge(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label htmlFor="maxAge">Max Age</Label>
                <Input
                  id="maxAge"
                  type="number"
                  placeholder="65"
                  value={maxAge || ''}
                  onChange={(e) => setMaxAge(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>

            {/* Availability */}
            <div>
              <Label htmlFor="availability">Availability</Label>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger id="availability">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="open_to_offers">Open to Offers</SelectItem>
                  <SelectItem value="not_available">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interests */}
            <div>
              <Label>Interests</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add an interest..."
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                />
                <Button type="button" variant="outline" onClick={handleAddInterest}>
                  Add
                </Button>
              </div>
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <div
                      key={interest}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                    >
                      {interest}
                      <button
                        onClick={() => handleRemoveInterest(interest)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSearch} className="flex-1">
                Apply Filters
              </Button>
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
