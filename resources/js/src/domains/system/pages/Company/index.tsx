import React, { useState } from 'react';
import { useCompanies } from './hooks/useCompanies';
import { PageHeader } from '@/components/shared/system/PageHeader';
import AddCompanyModal from './components/AddCompanyModal';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building, MoreHorizontal } from 'lucide-react';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

const CompanyPage = () => {
    const { t } = useTranslation();
    const { data, isLoading } = useCompanies();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div>
            <PageHeader 
                title={t('company_management')} 
                subtitle={t('manage_tenants_and_organizations')}
            >
                <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('add_company')}
                </Button>
            </PageHeader>

            <AddCompanyModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />

            <Card className="backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        {t('all_companies')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border/50">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>{t('company_name')}</TableHead>
                                    <TableHead>{t('tax_id')}</TableHead>
                                    <TableHead>{t('currency')}</TableHead>
                                    <TableHead>{t('created_at')}</TableHead>
                                    <TableHead className="text-right">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            {t('loading')}...
                                        </TableCell>
                                    </TableRow>
                                ) : data?.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            {t('no_companies_found')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data?.data.map((company) => (
                                        <TableRow key={company.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium">{company.name}</TableCell>
                                            <TableCell>{company.tax_id || '-'}</TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                                    {company.base_currency}
                                                </span>
                                            </TableCell>
                                            <TableCell>{new Date(company.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>{t('edit')}</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">{t('delete')}</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CompanyPage;
