import { Vehicle } from '../../services/driverShiftService';

export interface Company {
  id: string;
  name: string;
  logo_full_url: string | null;
  status: string;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  role: string;
  profile_full_url: string | null;
  company?: Company | null;
}

export interface LanguageOption {
  code: string;
  label: string;
}

export interface LanguageButtonProps {
  code: string;
  label: string;
  isActive: boolean;
  onClick: (code: string) => void;
}
