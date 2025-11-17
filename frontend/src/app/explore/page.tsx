'use client';

import { useState, useMemo } from 'react';
import { templates, categoryLabels, type Category } from '@/data/templates';
import { TemplateCard } from '@/components/template-card';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles } from 'lucide-react';

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.shortDescription.toLowerCase().includes(query) ||
        t.fullDescription.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery]);

  const popularTemplates = templates.filter(t => t.popular);

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-12 space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-5xl font-bold">
            Automation <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Templates</span>
          </h1>
        </div>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Browse ready-made automation templates and get started in seconds. No coding required.
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-8">
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border/40 bg-background/50 py-3 pl-12 pr-4 backdrop-blur transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setSelectedCategory('all')}
          className="group"
        >
          <Badge 
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer px-4 py-2 text-sm transition-all group-hover:border-primary"
          >
            All Templates
          </Badge>
        </button>
        {(Object.keys(categoryLabels) as Category[]).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className="group"
          >
            <Badge 
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2 text-sm transition-all group-hover:border-primary"
            >
              {categoryLabels[category]}
            </Badge>
          </button>
        ))}
      </div>

      {/* Popular Templates Section */}
      {selectedCategory === 'all' && !searchQuery && (
        <div className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">🔥 Popular Templates</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {popularTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}

      {/* All Templates / Filtered Results */}
      <div>
        <h2 className="mb-6 text-2xl font-bold">
          {searchQuery ? `Search Results (${filteredTemplates.length})` : 
           selectedCategory === 'all' ? 'All Templates' : 
           `${categoryLabels[selectedCategory]} Templates`}
        </h2>
        
        {filteredTemplates.length === 0 ? (
          <div className="rounded-lg border border-border/40 bg-card/30 p-12 text-center">
            <p className="text-lg text-muted-foreground">
              No templates found matching your criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
