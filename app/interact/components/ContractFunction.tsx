'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Eye, 
  Edit, 
  Copy, 
  ChevronDown, 
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react';
import { ContractFunction } from '@/app/types/contract';
import { useToast } from '@/components/providers/toast-provider';
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ContractFunctionProps {
  contractFunction: ContractFunction;
  contractAddress: string;
  networkId: string;
  onResult: (functionName: string, result: any) => void;
  onLoading: (functionName: string, isLoading: boolean) => void;
  isLoading: boolean;
  result?: any;
}

interface FunctionInputValue {
  name: string;
  type: string;
  value: string;
}

export default function ContractFunctionComponent({
  contractFunction,
  contractAddress,
  networkId,
  onResult,
  onLoading,
  isLoading,
  result
}: ContractFunctionProps) {
  const { toast } = useToast();
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if this is a read or write function
  const isReadFunction = contractFunction.stateMutability === 'view' || 
                        contractFunction.stateMutability === 'pure' || 
                        contractFunction.constant;

  // Format function signature
  const functionSignature = useMemo(() => {
    const inputs = contractFunction.inputs.map(input => `${input.type} ${input.name}`).join(', ');
    const outputs = contractFunction.outputs?.length > 0 
      ? ` returns (${contractFunction.outputs.map(output => 
          output.name ? `${output.type} ${output.name}` : output.type
        ).join(', ')})`
      : '';
    return `${contractFunction.name}(${inputs})${outputs}`;
  }, [contractFunction]);

  // Handle input value changes
  const handleInputChange = useCallback((inputName: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [inputName]: value
    }));
    setError(null);
  }, []);

  // Validate and format input value based on type
  const formatInputValue = useCallback((type: string, value: string) => {
    if (!value) return '';
    
    try {
      if (type.includes('int')) {
        // Handle integer types
        return BigInt(value).toString();
      } else if (type === 'bool') {
        // Handle boolean types
        return value.toLowerCase() === 'true';
      } else if (type.includes('[]')) {
        // Handle array types
        return JSON.parse(value);
      } else if (type === 'address') {
        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
          throw new Error('Invalid address format');
        }
        return value;
      } else {
        // For string, bytes, etc.
        return value;
      }
    } catch (error) {
      throw new Error(`Invalid ${type} format: ${error}`);
    }
  }, []);

  // Execute the contract function
  const handleExecute = useCallback(async () => {
    setError(null);
    onLoading(contractFunction.name, true);

    try {
      // Validate and format inputs
      const formattedInputs: any[] = [];
      for (const input of contractFunction.inputs) {
        const value = inputValues[input.name] || '';
        if (value === '' && input.type !== 'string') {
          throw new Error(`${input.name} is required`);
        }
        
        try {
          const formattedValue = formatInputValue(input.type, value);
          formattedInputs.push(formattedValue);
        } catch (err: any) {
          throw new Error(`Error in ${input.name}: ${err.message}`);
        }
      }

             // Call contract function via API
       const response = await fetch('/api/call-contract-function', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           contractAddress,
           functionName: contractFunction.name,
           parameters: formattedInputs,
           isQuery: isReadFunction,
           abi: [contractFunction], // Pass the function ABI
           networkId
         })
       });

       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || 'Function call failed');
       }

       const result = await response.json();

      onResult(contractFunction.name, {
        success: true,
        result: result,
        timestamp: new Date(),
        inputs: formattedInputs
      });

      toast({
        title: 'Function Executed',
        description: `${contractFunction.name} executed successfully`,
        type: 'success'
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Function execution failed';
      setError(errorMessage);
      
      onResult(contractFunction.name, {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
        inputs: Object.values(inputValues)
      });

      toast({
        title: 'Execution Failed',
        description: errorMessage,
        type: 'error'
      });
    } finally {
      onLoading(contractFunction.name, false);
    }
  }, [
    contractFunction,
    contractAddress,
    networkId,
    inputValues,
    formatInputValue,
    isReadFunction,
    onLoading,
    onResult,
    toast
  ]);

  // Copy function signature
  const copySignature = useCallback(() => {
    navigator.clipboard.writeText(functionSignature);
    toast({
      title: 'Signature Copied',
      description: 'Function signature copied to clipboard',
      type: 'success'
    });
  }, [functionSignature, toast]);

  // Format result for display
  const formatResult = useCallback((result: any) => {
    if (result === null || result === undefined) return 'null';
    if (typeof result === 'boolean') return result.toString();
    if (typeof result === 'bigint') return result.toString();
    if (Array.isArray(result)) return JSON.stringify(result, null, 2);
    if (typeof result === 'object') return JSON.stringify(result, null, 2);
    return result.toString();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              isReadFunction 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' 
                : 'bg-orange-100 text-orange-600 dark:bg-orange-900/20'
            }`}>
              {isReadFunction ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {contractFunction.name}
                <Badge variant={isReadFunction ? 'secondary' : 'default'}>
                  {isReadFunction ? 'read' : 'write'}
                </Badge>
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                {functionSignature}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                copySignature();
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Function Inputs */}
          {contractFunction.inputs.length > 0 && (
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-sm">Parameters</h4>
              <div className="grid gap-4">
                {contractFunction.inputs.map((input, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`${contractFunction.name}-${input.name}`}>
                      {input.name}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {input.type}
                      </Badge>
                    </Label>
                    <Input
                      id={`${contractFunction.name}-${input.name}`}
                      value={inputValues[input.name] || ''}
                      onChange={(e) => handleInputChange(input.name, e.target.value)}
                      placeholder={`Enter ${input.type} value`}
                      disabled={isLoading}
                    />
                    {/* Type-specific hints */}
                    {input.type.includes('[]') && (
                      <p className="text-xs text-muted-foreground">
                        Enter array as JSON, e.g. [1,2,3] or ["a","b"]
                      </p>
                    )}
                    {input.type === 'bool' && (
                      <p className="text-xs text-muted-foreground">
                        Enter "true" or "false"
                      </p>
                    )}
                    {input.type === 'address' && (
                      <p className="text-xs text-muted-foreground">
                        Enter a valid Ethereum address (0x...)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execute Button */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              onClick={handleExecute}
              disabled={isLoading}
              className={isReadFunction ? '' : 'bg-orange-600 hover:bg-orange-700'}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Executing...' : (isReadFunction ? 'Query' : 'Execute')}
            </Button>
            
            {!isReadFunction && (
              <Alert className="flex-1">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This function will modify the blockchain state and may require gas
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Result Display */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">Result</h4>
                <Badge variant={result.success ? 'default' : 'destructive'}>
                  {result.success ? 'Success' : 'Failed'}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {result.timestamp?.toLocaleString()}
                </span>
              </div>
              
              {result.success ? (
                <div className="space-y-2">
                  {result.result && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border">
                      <ScrollArea className="max-h-40">
                        <pre className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                          {formatResult(result.result)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                  
                  {result.transactionId && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Transaction:</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {result.transactionId}
                      </Badge>
                                              <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (result.explorerUrl) {
                              window.open(result.explorerUrl, '_blank');
                            }
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {result.error}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      )}
    </Card>
  );
} 