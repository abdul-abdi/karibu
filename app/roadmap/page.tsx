'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Sparkles, Code, Shield, Zap, Users, Globe, Database, Lock, LineChart, MessageSquare, FileCode, BookOpen, Cpu, GitBranch, Bug, Rocket, Bot, ArrowRight, Braces, Star, Binoculars, Construction, AlertTriangle, BrainCircuit, Lightbulb, Eye, Search, Edit, Wand2, TestTube, CloudUpload, Monitor, Network, Palette, Gamepad2, Target, Layers, Workflow, Microscope, Gauge, TrendingUp, Award, ShieldCheck, ArrowUpRight, Plug, Blocks, Headphones, UserCheck, Briefcase, Megaphone, Trophy, Gift, Coins, Timer, Webhook, Activity, BarChart3, PieChart, Settings, Wrench, Hammer, Crosshair, Radar, Compass, Map, Route, Calendar, Clock3, Hourglass } from 'lucide-react';

const roadmapItems = [
  {
    title: 'Production Ready Features',
    status: 'completed',
    items: [
      {
        title: 'Smart Contract Creation & Development',
        description: 'Full-featured IDE for creating and deploying smart contracts',
        icon: Code,
        details: [
          'Simple and Advanced Multi-File IDE with syntax highlighting',
          'Real-time compilation and validation',
          'Deploy to Ethereum testnet and mainnet',
          'Project templates (ERC20, NFT, DAO, DeFi)',
          'OpenZeppelin library integration',
          'Dependency management and resolution',
          'Full-screen IDE mode with popup guides'
        ]
      },
      {
        title: 'Comprehensive Learning Platform',
        description: 'Educational resources and interactive tutorials',
        icon: BookOpen,
        details: [
          'Smart contract development fundamentals',
          'Solidity programming guide',
          'Blockchain concepts and best practices',
          'Security patterns and vulnerability prevention',
          'Interactive code examples and exercises',
          'Progressive difficulty levels'
        ]
      },
      {
        title: 'Template Gallery & Quick Start',
        description: 'Professional contract templates with detailed documentation',
        icon: Star,
        details: [
          'Categorized template library (DeFi, NFT, DAO, Tokens)',
          'Detailed use cases and technical specifications',
          'Difficulty indicators and feature tags',
          'One-click template integration',
          'Seamless workflow from browsing to development',
          'Community-contributed templates'
        ]
      },
      {
        title: 'Karibu AI Assistant',
        description: 'Intelligent blockchain and smart contract guidance',
        icon: Bot,
        details: [
          'Real-time code suggestions and explanations',
          'Solidity and blockchain knowledge base',
          'Smart contract security recommendations',
          'Deployment and testing guidance',
          'Error resolution and debugging help',
          'Context-aware assistance throughout development'
        ]
      },
      {
        title: 'Advanced Code Editor',
        description: 'Professional-grade development environment',
        icon: FileCode,
        details: [
          'Syntax highlighting and error detection',
          'Code autocompletion and snippets',
          'Real-time linting and validation',
          'Tabbed interface for multi-file projects',
          'Project organization with folders',
          'Import resolution and dependency tracking'
        ]
      },
      {
        title: 'Deployment & Network Management',
        description: 'Seamless contract deployment across networks',
        icon: Rocket,
        details: [
          'One-click deployment to multiple networks',
          'Automatic network detection and configuration',
          'Transaction monitoring and confirmation',
          'Gas estimation and optimization',
          'Contract verification and publication',
          'Deployment history and tracking'
        ]
      }
    ]
  },
  {
    title: 'Under Active Development',
    status: 'current',
    items: [
      {
        title: 'Contract Interaction Interface',
        description: 'Universal smart contract interaction and testing platform',
        icon: Zap,
        details: [
          'Dynamic ABI detection and parsing',
          'Contract function discovery and visualization',
          'Real-time contract state monitoring',
          'Transaction execution with detailed feedback',
          'Multi-network contract support',
          'Recent contracts history and quick access'
        ]
      },
      {
        title: 'Wallet Contract Explorer',
        description: 'Comprehensive wallet analysis and contract discovery',
        icon: Search,
        details: [
          'Wallet address contract discovery',
          'Contract type identification and classification',
          'Deployment history and timeline',
          'Contract interaction analysis',
          'Cross-format address support (Hedera, EVM)',
          'Advanced filtering and search capabilities'
        ]
      },
      {
        title: 'Community & Collaboration Hub',
        description: 'Social features for developers and learners',
        icon: Users,
        details: [
          'Developer profiles and portfolios',
          'Contract sharing and collaboration',
          'Community feedback and ratings',
          'Discussion forums and Q&A',
          'Code review and mentorship',
          'Project showcases and galleries'
        ]
      },
      {
        title: 'Advanced Security Analysis',
        description: 'Comprehensive security scanning and vulnerability detection',
        icon: Shield,
        details: [
          'Automated vulnerability scanning',
          'Gas optimization analysis',
          'Access control verification',
          'Common attack vector detection',
          'Security score and recommendations',
          'Integration with security audit tools'
        ]
      }
    ]
  },
  {
    title: 'Future Innovations (Q2-Q3 2025)',
    status: 'future',
    items: [
      {
        title: 'AI-Powered Smart Contract Editor',
        description: 'Revolutionary AI assistance for writing and reviewing smart contracts',
        icon: BrainCircuit,
        details: [
          'Intelligent code generation from natural language',
          'Automated security vulnerability detection and fixes',
          'Code optimization suggestions and implementations',
          'Real-time code review and best practice recommendations',
          'Context-aware documentation generation',
          'Smart refactoring and pattern recognition',
          'Multi-language support (Solidity, Vyper, Rust)',
          'Integration with major AI models for enhanced capabilities'
        ]
      },
      {
        title: 'Visual Smart Contract Builder',
        description: 'Drag-and-drop interface for creating smart contracts',
        icon: Blocks,
        details: [
          'Visual programming interface with logic blocks',
          'Pre-built function modules and components',
          'Real-time code generation from visual design',
          'Template-based contract assembly',
          'Integration with existing code editor',
          'Complex logic visualization and flowcharts'
        ]
      },
      {
        title: 'Advanced Testing & Simulation',
        description: 'Comprehensive testing framework and simulation environment',
        icon: TestTube,
        details: [
          'Automated unit test generation',
          'Integration testing with mock environments',
          'Gas usage simulation and optimization',
          'Load testing and performance benchmarking',
          'Scenario-based testing with AI-generated test cases',
          'Real-world condition simulation'
        ]
      },
      {
        title: 'Enterprise Development Suite',
        description: 'Professional tools for large-scale smart contract development',
        icon: Briefcase,
        details: [
          'Team collaboration and version control',
          'Advanced project management features',
          'Enterprise-grade security and compliance',
          'Custom deployment pipelines and CI/CD',
          'Role-based access control and permissions',
          'Advanced analytics and reporting dashboard'
        ]
      },
      {
        title: 'DeFi Protocol Builder',
        description: 'Specialized tools for building decentralized finance applications',
        icon: Coins,
        details: [
          'Pre-built DeFi protocol templates',
          'Liquidity pool and yield farming builders',
          'Automated market maker (AMM) creation',
          'Governance token and DAO setup',
          'Risk assessment and economic modeling',
          'Integration with major DeFi protocols'
        ]
      }
    ]
  },
  {
    title: 'Long-term Vision (Q4 2025 & Beyond)',
    status: 'future',
    items: [
      {
        title: 'Autonomous Smart Contract Auditor',
        description: 'AI-powered autonomous security auditing system',
        icon: ShieldCheck,
        details: [
          'Continuous automated security monitoring',
          'Machine learning-based vulnerability prediction',
          'Autonomous bug fixing and patching',
          'Real-time threat detection and response',
          'Formal verification integration',
          'Compliance checking and regulatory alignment'
        ]
      },
      {
        title: 'Advanced Analytics & Intelligence',
        description: 'Comprehensive blockchain analytics and business intelligence',
        icon: BarChart3,
        details: [
          'Real-time contract performance monitoring',
          'Predictive analytics for gas optimization',
          'User behavior analysis and insights',
          'Market trend analysis and recommendations',
          'Custom dashboard and reporting tools',
          'Integration with external data sources'
        ]
      },
      {
        title: 'Decentralized Development Network',
        description: 'Distributed development and deployment infrastructure',
        icon: Workflow,
        details: [
          'Decentralized build and deployment system',
          'Distributed code storage and version control',
          'Peer-to-peer collaboration network',
          'Consensus-based code review process',
          'Decentralized testing and validation',
          'Token-based incentive system for contributors'
        ]
      }
    ]
  }
];

const statusConfig = {
  completed: {
    color: 'bg-background border-border text-foreground',
    icon: CheckCircle2,
    gradient: 'bg-background/50',
    label: 'Production Ready',
    dotColor: 'bg-primary',
    badgeColor: 'bg-green-500/10 text-green-600 border-green-500/20'
  },
  current: {
    color: 'bg-background border-border text-foreground',
    icon: Clock,
    gradient: 'bg-background/50',
    label: 'In Development', 
    dotColor: 'bg-primary',
    badgeColor: 'bg-primary/10 text-primary border-primary/20'
  },
  future: {
    color: 'bg-background border-border text-foreground',
    icon: Sparkles,
    gradient: 'bg-background/50',
    label: 'Planned',
    dotColor: 'bg-primary',
    badgeColor: 'bg-muted text-muted-foreground border-border'
  }
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <section className="relative py-12 md:py-16 mb-0">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <motion.div
            className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
            animate={{
              x: [0, 30, 0],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl"
            animate={{
              y: [0, 40, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" 
               style={{backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px'}} />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-indigo-500">
              Karibu Development Roadmap
            </h1>
            <p className="text-xl text-foreground/80 mb-8">
              Building the future of smart contract development with AI-powered tools and comprehensive blockchain solutions
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {['completed', 'current', 'future'].map((status, index) => {
                const config = statusConfig[status as keyof typeof statusConfig];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={status}
                    className="bg-background border border-border rounded-lg p-6 hover:border-primary/50 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + (index * 0.1) }}
                  >
                    <div className="flex items-center mb-3">
                      <Icon className="h-6 w-6 text-primary mr-2" />
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${config.badgeColor}`}>
                        {status === 'completed' && 'Live'}
                        {status === 'current' && 'Active'}
                        {status === 'future' && 'Planned'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{config.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {status === 'completed' && 'Fully functional features ready for production use'}
                      {status === 'current' && 'Currently under active development'}
                      {status === 'future' && 'Planned for future development cycles'}
                    </p>
                  </motion.div>
                );
              })}
            </div>
            

          </motion.div>
        </div>
      </section>

      {/* Roadmap Content */}
      <section className="pt-8 pb-12">
        <div className="container mx-auto px-4">
          <div className="space-y-16 relative max-w-6xl mx-auto">
            
            {roadmapItems.map((section, sectionIndex) => {
              const config = statusConfig[section.status as keyof typeof statusConfig];
              const StatusIcon = config.icon;
              
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: sectionIndex * 0.3 }}
                  className="relative"
                >
                  {/* Section Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-background border border-border">
                      <StatusIcon className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{config.label}</span>
                    </div>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  
                  {/* Features Grid */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: (sectionIndex * 0.3) + (itemIndex * 0.1) }}
                          className="bg-background border border-border rounded-lg p-6 hover:border-primary/50 transition-all duration-300"
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 rounded-lg bg-muted border border-border">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {item.details.map((detail, detailIndex) => (
                              <div 
                                key={detailIndex} 
                                className="flex items-start gap-2 text-sm"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <span className="text-muted-foreground">
                                  {detail}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-16 text-center"
          >
            <div className="max-w-3xl mx-auto bg-background border border-border rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-indigo-500">
                Ready to Build the Future?
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Join thousands of developers using Karibu to create, deploy, and manage smart contracts with AI-powered tools, comprehensive security analysis, and seamless deployment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Code className="h-5 w-5" />
                  Start Building
                  <ArrowRight className="h-4 w-4" />
                </motion.a>
                <motion.a
                  href="/learn"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted/50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BookOpen className="h-5 w-5" />
                  Learn More
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 