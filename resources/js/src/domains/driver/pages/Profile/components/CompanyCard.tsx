import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Building2 } from 'lucide-react';
import { Company } from '../types';

interface CompanyCardProps {
  company: Company | null;
  label: string;
}

export const CompanyCard = React.memo(({ company, label }: CompanyCardProps) => {
  if (!company) return null;

  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 rounded-full border border-gray-100 bg-gray-50 p-1 relative overflow-hidden">
          {company.logo_full_url ? (
            <>
              {!isLoaded && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-xl" />
              )}
              <AvatarImage
                src={company.logo_full_url}
                alt={company.name}
                className={`object-contain transition-opacity duration-300 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                onLoad={() => setIsLoaded(true)}
              />
            </>
          ) : null}
          <AvatarFallback className="bg-gray-100 text-gray-400 rounded-xl">
            <Building2 size={20} />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
            {label}
          </p>
          <p className="text-sm font-bold text-gray-800 leading-tight">{company.name}</p>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
        {company.status}
      </span>
    </div>
  );
});

CompanyCard.displayName = 'CompanyCard';
