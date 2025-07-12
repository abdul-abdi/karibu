'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Code2Icon, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const TipsPopup: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            <span>Smart Contract Tips</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          {[
            "Use Solidity version 0.8.0 or later for built-in overflow checks",
            "Avoid using tx.origin for authentication - use msg.sender instead",
            "Always check return values from external calls",
            "Follow the checks-effects-interactions pattern to prevent reentrancy",
            "Use specific visibility modifiers for all functions and state variables",
            "Limit gas consumption in loops to prevent DOS attacks",
            "Consider using OpenZeppelin's battle-tested contracts",
            "Add comprehensive test coverage before deployment",
            "Document your code with NatSpec comments",
            "Use SafeMath for versions prior to Solidity 0.8.0"
          ].map((tip, i) => (
            <motion.div 
              key={i}
              className="flex items-start p-3 rounded-lg hover:bg-background/80 transition-colors"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-primary text-xs font-bold">{i+1}</span>
              </div>
              <p className="text-sm text-foreground/80">{tip}</p>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const IDEGuidePopup: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({ open, onOpenChange }) => {
  const advancedIDEDetails = [
    {
      title: "Advanced IDE Capabilities",
      items: [
        {
          name: "Multi-file Project Support",
          description: "Manage complex projects with multiple contract files and dependencies"
        },
        {
          name: "File System Explorer",
          description: "Create, rename, and organize files and folders with an intuitive file browser"
        },
        {
          name: "Dependency Management",
          description: "Automatic resolution of imports between files with circular dependency detection"
        },
        {
          name: "External Library Integration",
          description: "Seamless support for OpenZeppelin and other external Solidity libraries"
        },
        {
          name: "Project Templates",
          description: "Start with pre-configured templates for ERC20, NFT, DAO, and crowdfunding projects"
        }
      ]
    },
    {
      title: "Professional Development",
      items: [
        {
          name: "Contract Inheritance",
          description: "Create complex contracts with multiple inheritance across multiple files"
        },
        {
          name: "Smart Compilation",
          description: "Intelligently compiles all dependent files together with proper import resolution"
        },
        {
          name: "Library Version Detection",
          description: "Automatic detection of compatible library versions based on usage patterns"
        },
        {
          name: "Enhanced Editor Features",
          description: "Tabbed editing, syntax highlighting, and real-time validation across all files"
        },
        {
          name: "Professional Project Structure",
          description: "Organize your contracts with industry-standard folder structures and patterns"
        }
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Code2Icon className="h-6 w-6 mr-3 text-primary" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
              Advanced IDE Guide
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-8 mt-6">
          {advancedIDEDetails.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-5">
              <h3 className="text-lg font-semibold text-foreground/90 border-b border-border/40 pb-2">
                {section.title}
              </h3>
              <div className="space-y-5">
                {section.items.map((item, itemIndex) => (
                  <motion.div 
                    key={itemIndex}
                    className="p-4 rounded-lg hover:bg-background/80 border border-border/20 hover:border-primary/20 transition-all duration-200"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: itemIndex * 0.1 }}
                  >
                    <div className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        <span className="text-primary text-sm font-bold">{itemIndex + 1}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-1">{item.name}</h4>
                        <p className="text-sm text-foreground/70">{item.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-border/30">
          <div className="flex items-center space-x-2 text-sm text-foreground/60">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p>
              <span className="font-medium text-foreground/80">Tip:</span> {' '}
              The Advanced IDE offers a professional development experience for complex multi-file projects.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 