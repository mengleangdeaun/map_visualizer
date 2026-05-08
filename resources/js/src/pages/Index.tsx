import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Starter Page</h1>
            <p>Welcome to the MapCN starter project.</p>
            <div>
                <Link 
                    to="/map" 
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                    View Map Demo
                </Link>
                <Button>Button</Button>
            </div>
        </div>
    );
};

export default Index;
