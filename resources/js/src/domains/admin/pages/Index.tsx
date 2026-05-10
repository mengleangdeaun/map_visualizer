import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

const Index = () => {
    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Starter Page</h1>
            <p>Welcome to the MapCN starter project.</p>
            <div>

                <Button>Button</Button>
            </div>
        </div>
    );
};

export default Index;
