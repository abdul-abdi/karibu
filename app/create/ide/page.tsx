'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, Lightbulb, ExternalLink, X } from 'lucide-react';
import MultiFileIDE, { MultiFileIDEHandle } from '../MultiFileIDE';
import { TipsPopup, IDEGuidePopup } from './components/IDEPopups';
import { useToast } from '@/components/providers/toast-provider';
import { useContractDeployer } from '../../hooks/useContractDeployer';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Utility function to parse constructor inputs from ABI
function parseConstructorInputs(abi: any[]) {
  const constructor = abi.find(item => item.type === 'constructor');
  return constructor ? constructor.inputs || [] : [];
}

// Component to render constructor argument form
function ConstructorForm({ inputs, onChange }: { 
  inputs: { name: string; type: string; }[]; 
  onChange: (values: Record<string, any>) => void;
}) {
  const [values, setValues] = useState<Record<string, any>>({});

  const handleInputChange = (name: string, value: string) => {
    const newValues = { ...values, [name]: value };
    setValues(newValues);
    onChange(newValues);
  };

  return (
    <div className="space-y-4 my-4">
      {inputs.map((input) => (
        <div key={input.name} className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={input.name} className="text-right">
            {input.name} <span className="text-xs text-muted-foreground">({input.type})</span>
          </Label>
          <div className="col-span-3">
            <Input
              id={input.name}
              placeholder={`Enter ${input.type} value`}
              onChange={(e) => handleInputChange(input.name, e.target.value)}
              className="w-full"
            />
            {input.type.includes('[]') && (
              <p className="text-xs text-muted-foreground mt-1">
                Enter array as JSON, e.g. [1,2,3] or ["a","b"]
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StandaloneIDE() {
  const router = useRouter();
  const { toast } = useToast();
  const multiFileIDERef = useRef<MultiFileIDEHandle>(null);
  const { deploy: deployClient } = useContractDeployer();
  
  // State for popups
  const [showTips, setShowTips] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  // State for compilation and deployment
  const [compilationResult, setCompilationResult] = useState<any>(null);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deploymentProgress, setDeploymentProgress] = useState<number>(0);
  const [deploymentStage, setDeploymentStage] = useState<string>('');
  const [deploymentSuccess, setDeploymentSuccess] = useState<boolean>(false);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [constructorArgs, setConstructorArgs] = useState<Record<string, any>>({});
  const [error, setError] = useState<string>('');

  // Handle compilation from MultiFileIDE
  const handleMultiFileCompile = useCallback((result: any, fileId: string) => {
    setCompilationResult(result);
    setError('');
    
    toast({
      title: 'Compilation Successful',
      description: `${result.contractName || 'Contract'} compiled successfully`,
      type: 'success'
    });
  }, [toast]);

  // Handle validation from MultiFileIDE
  const handleMultiFileValidate = useCallback((result: any, fileId: string) => {
    // The MultiFileIDE handles validation display internally
    console.log('Validation result:', result);
  }, []);

  // Handle editor changes from MultiFileIDE
  const handleMultiFileEditorChange = useCallback((content: string, fileId: string) => {
    // The MultiFileIDE handles this internally
  }, []);

  // Handle deployment
  const handleDeploy = async () => {
    if (isDeploying) return;
    
    // Reset deployment states
    setDeploymentSuccess(false);
    setContractAddress('');
    setDeploymentProgress(0);
    setDeploymentStage('');
    setError('');
    
    // If we don't have a compile result yet, compile first
    if (!compilationResult) {
      if (multiFileIDERef.current) {
        const result = await multiFileIDERef.current.compileCurrentFile();
        if (!result) {
          toast({
            title: 'Compilation Required',
            description: 'Please compile your contract before deploying',
            type: 'error'
          });
          return;
        }
        setCompilationResult(result);
      }
    }
    
    // Check if contract has constructor parameters
    const constructorInputs = parseConstructorInputs(compilationResult.abi);
    
    if (constructorInputs.length > 0) {
      // Open the dialog for constructor arguments
      setIsDeployDialogOpen(true);
      return;
    }
    
    // If no constructor arguments, proceed with deployment
    await executeDeployment([]);
  };

  const executeDeployment = async (constructorArguments: any[]) => {
    setIsDeploying(true);
    setError('');
    setDeploymentProgress(10);
    setDeploymentStage('prepare');
    
    try {
      let target = compilationResult;
      console.log('Starting deployment process...');
      
      // Real deployment process
      setDeploymentProgress(30);
      setDeploymentStage('link');
      
      // Move to compilation check stage
      setDeploymentProgress(50);
      setDeploymentStage('compile');
      
      // Start actual deployment
      setDeploymentProgress(70);
      setDeploymentStage('deploy');
      
      // Call actual deployment via wallet
      const address = await deployClient({
        abi: target.abi as any,
        bytecode: target.bytecode as `0x${string}`,
        args: constructorArguments
      });

      const result = { contractAddress: address };
      console.log('Deployment result:', result);
      
      // Deployment confirmed
      setDeploymentProgress(90);
      setDeploymentStage('confirm');
      
      // Deployment complete
      setDeploymentProgress(100);
      setDeploymentStage('complete');
      
      // Set the contract address and deployment success
      if (result.contractAddress) {
        setContractAddress(result.contractAddress);
        setDeploymentSuccess(true);
        console.log('Deployment complete. Contract address:', result.contractAddress);

        // Show success notification
        toast({
          title: 'Deployment Successful',
          description: `Contract deployed at ${result.contractAddress}`,
          type: 'success'
        });
        
        // Notify the MultiFileIDE component
        if (multiFileIDERef.current) {
          multiFileIDERef.current.handleDeploymentSuccess(result.contractAddress);
        }
      } else {
        throw new Error('No contract address received from deployment');
      }
    } catch (err) {
      console.error("Deployment error:", err);
      setError(err.message || "Failed to deploy contract");
      setDeploymentProgress(0);
      setDeploymentStage('');
      setDeploymentSuccess(false);
      setContractAddress('');
      
      toast({
        title: 'Deployment Failed',
        description: err.message || 'Unknown error occurred during deployment',
        type: 'error'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDeployWithArgs = () => {
    // Format constructor arguments according to their types
    const constructorInputs = parseConstructorInputs(compilationResult.abi);
    const formattedArgs = constructorInputs.map(input => {
      const value = constructorArgs[input.name];
      
      try {
        if (input.type.includes('int')) {
          return value ? BigInt(value).toString() : '0';
        } else if (input.type === 'bool') {
          return value === 'true' || value === true;
        } else if (input.type.includes('[]')) {
          return value ? JSON.parse(value) : [];
        } else {
          return value || '';
        }
      } catch (error) {
        console.error(`Error formatting constructor arg ${input.name}:`, error);
        return value || '';
      }
    });
    
    // Close the dialog before starting deployment
    setIsDeployDialogOpen(false);
    
    // Execute deployment with formatted args
    executeDeployment(formattedArgs);
  };

  const handleCloseIDE = () => {
    if (window.opener) {
      window.close();
    } else {
      // If not opened from another window, navigate back to main create page
      router.push('/create');
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Top toolbar with help buttons */}
      <div className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Advanced IDE</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTips(true)}
              className="flex items-center gap-1"
            >
              <Lightbulb className="h-4 w-4" />
              Tips
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              Guide
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {contractAddress && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/interact/${contractAddress}`)}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              Interact
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseIDE}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      </div>

      {/* Main IDE area */}
      <div className="flex-1 overflow-hidden">
        <MultiFileIDE
          ref={multiFileIDERef}
          onCompile={handleMultiFileCompile}
          onValidate={handleMultiFileValidate}
          onEditorChange={handleMultiFileEditorChange}
          onDeploy={handleDeploy}
        />
      </div>

      {/* Popups */}
      <TipsPopup open={showTips} onOpenChange={setShowTips} />
      <IDEGuidePopup open={showGuide} onOpenChange={setShowGuide} />

      {/* Constructor Arguments Dialog */}
      <Dialog open={isDeployDialogOpen} onOpenChange={setIsDeployDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Constructor Arguments</DialogTitle>
            <DialogDescription>
              This contract requires the following constructor arguments:
            </DialogDescription>
          </DialogHeader>
          
          <ConstructorForm 
            inputs={compilationResult ? parseConstructorInputs(compilationResult.abi) : []}
            onChange={setConstructorArgs}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeployDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeployWithArgs} disabled={isDeploying}>
              {isDeploying ? 'Deploying...' : 'Deploy Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 