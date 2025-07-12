'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Code, 
  FileText, 
  Hash,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { ContractFunction } from '@/app/types/contract';
import { useToast } from '@/components/providers/toast-provider';

interface ABIViewerProps {
  abi: ContractFunction[];
  constructor?: ContractFunction;
  events: ContractFunction[];
  contractAddress: string;
}

export default function ABIViewer({
  abi,
  constructor,
  events,
  contractAddress
}: ABIViewerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('abi');

  // Format the ABI as JSON string
  const formattedABI = JSON.stringify(abi, null, 2);

  // Copy ABI to clipboard
  const copyABI = useCallback(() => {
    navigator.clipboard.writeText(formattedABI);
    toast({
      title: 'ABI Copied',
      description: 'Contract ABI copied to clipboard',
      type: 'success'
    });
  }, [formattedABI, toast]);

  // Copy function signature
  const copyFunctionSignature = useCallback((func: ContractFunction) => {
    const inputs = func.inputs.map(input => `${input.type} ${input.name}`).join(', ');
    const outputs = func.outputs?.length > 0 
      ? ` returns (${func.outputs.map(output => 
          output.name ? `${output.type} ${output.name}` : output.type
        ).join(', ')})`
      : '';
    const signature = `${func.name}(${inputs})${outputs}`;
    
    navigator.clipboard.writeText(signature);
    toast({
      title: 'Signature Copied',
      description: `${func.name} signature copied to clipboard`,
      type: 'success'
    });
  }, [toast]);

  // Get function type badge color
  const getFunctionBadge = (func: ContractFunction) => {
    if (func.stateMutability === 'view' || func.stateMutability === 'pure' || func.constant) {
      return { variant: 'secondary' as const, label: 'Read', color: 'text-blue-600' };
    }
    return { variant: 'default' as const, label: 'Write', color: 'text-orange-600' };
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="abi">Full ABI</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="events">Events & Constructor</TabsTrigger>
        </TabsList>

        {/* Full ABI Tab */}
        <TabsContent value="abi">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Contract ABI
                  </CardTitle>
                  <CardDescription>
                    Complete Application Binary Interface for this contract
                  </CardDescription>
                </div>
                <Button onClick={copyABI} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy ABI
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Contract: <code className="bg-muted px-1 rounded">{contractAddress}</code></span>
                  <span>Functions: {abi.length}</span>
                </div>
                <ScrollArea className="h-96 w-full border rounded-lg">
                  <pre className="p-4 text-sm bg-muted/50">
                    <code>{formattedABI}</code>
                  </pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Functions Tab */}
        <TabsContent value="functions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Function Signatures
              </CardTitle>
              <CardDescription>
                All available functions with their signatures and mutability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {abi.filter(item => item.type === 'function').map((func, index) => {
                  const badge = getFunctionBadge(func);
                  const inputs = func.inputs.map(input => `${input.type} ${input.name}`).join(', ');
                  const outputs = func.outputs?.length > 0 
                    ? ` returns (${func.outputs.map(output => 
                        output.name ? `${output.type} ${output.name}` : output.type
                      ).join(', ')})`
                    : '';
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{func.name}</span>
                          <Badge variant={badge.variant} className={badge.color}>
                            {badge.label}
                          </Badge>
                          {func.stateMutability && (
                            <Badge variant="outline" className="text-xs">
                              {func.stateMutability}
                            </Badge>
                          )}
                        </div>
                        <code className="text-sm text-muted-foreground">
                          {func.name}({inputs}){outputs}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyFunctionSignature(func)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events & Constructor Tab */}
        <TabsContent value="events">
          <div className="space-y-6">
            {/* Constructor */}
            {constructor && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Constructor
                  </CardTitle>
                  <CardDescription>
                    Contract constructor function used during deployment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">constructor</span>
                          <Badge variant="outline" className="text-yellow-600">
                            Constructor
                          </Badge>
                        </div>
                        <code className="text-sm text-muted-foreground">
                          constructor({constructor.inputs.map(input => `${input.type} ${input.name}`).join(', ')})
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyFunctionSignature(constructor)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Events
                  <Badge variant="secondary">{events.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Contract events that can be emitted during execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                {events.length > 0 ? (
                  <div className="space-y-3">
                    {events.map((event, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{event.name}</span>
                            <Badge variant="outline" className="text-green-600">
                              Event
                            </Badge>
                          </div>
                          <code className="text-sm text-muted-foreground">
                            {event.name}({event.inputs.map(input => `${input.type} ${input.name}`).join(', ')})
                          </code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyFunctionSignature(event)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No events found in this contract</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 