import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import DeploymentSelector from './DeploymentSelector';

const formSchema = z.object({
  serverName: z.string().min(1, 'Server name is required'),
  description: z.string().min(1, 'Description is required'),
  serverType: z.enum(['python', 'typescript']),
  tools: z.array(
    z.object({
      name: z.string().min(1, 'Tool name is required'),
      description: z.string().min(1, 'Tool description is required'),
      parameters: z.array(
        z.object({
          name: z.string().min(1, 'Parameter name is required'),
          type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
          description: z.string().min(1, 'Parameter description is required'),
          required: z.boolean().default(true),
        })
      ).optional()
    })
  ).min(1, 'At least one tool is required')
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateServerForm() {
  const [isCreating, setIsCreating] = useState(false);
  const [buildId, setBuildId] = useState<string | null>(null);
  const [serverType, setServerType] = useState<string>("typescript");
  const [showDeployment, setShowDeployment] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serverName: 'My MCP Server',
      description: 'A custom MCP server for Claude',
      serverType: 'typescript',
      tools: [
        {
          name: 'hello_world',
          description: 'A simple greeting tool',
          parameters: []
        }
      ]
    }
  });

  const addTool = () => {
    const currentTools = form.getValues('tools') || [];
    form.setValue('tools', [
      ...currentTools,
      {
        name: '',
        description: '',
        parameters: []
      }
    ]);
  };

  const removeTool = (index: number) => {
    const currentTools = form.getValues('tools') || [];
    form.setValue('tools', currentTools.filter((_, i) => i !== index));
  };

  const addParameter = (toolIndex: number) => {
    const currentTools = form.getValues('tools');
    const currentParams = currentTools[toolIndex].parameters || [];
    
    const updatedTools = [...currentTools];
    updatedTools[toolIndex] = {
      ...updatedTools[toolIndex],
      parameters: [
        ...currentParams,
        {
          name: '',
          type: 'string',
          description: '',
          required: true
        }
      ]
    };
    
    form.setValue('tools', updatedTools);
  };

  const removeParameter = (toolIndex: number, paramIndex: number) => {
    const currentTools = form.getValues('tools');
    const currentParams = currentTools[toolIndex].parameters || [];
    
    const updatedTools = [...currentTools];
    updatedTools[toolIndex] = {
      ...updatedTools[toolIndex],
      parameters: currentParams.filter((_, i) => i !== paramIndex)
    };
    
    form.setValue('tools', updatedTools);
  };

  const onSubmit = async (data: FormValues) => {
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/create-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create server');
      }
      
      const result = await response.json();
      
      // If success, store the build ID and show deployment options
      if (result.success && result.buildId) {
        setBuildId(result.buildId);
        setServerType(data.serverType);
        setShowDeployment(true);
      }
      
    } catch (error) {
      console.error('Error creating server:', error);
      alert(error instanceof Error ? error.message : 'Failed to create server');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {showDeployment && buildId ? (
        <Card>
          <CardHeader>
            <CardTitle>Deploy Your MCP Server</CardTitle>
            <CardDescription>
              Your MCP server has been created successfully. Now you can deploy it to a hosting platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeploymentSelector 
              buildId={buildId} 
              serverType={serverType}
              onDeploymentComplete={(deploymentId, platformId) => {
                console.log(`Deployment ${deploymentId} to ${platformId} completed successfully`);
              }} 
            />
          </CardContent>
        </Card>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Server Details</CardTitle>
                    <CardDescription>
                      Basic information about your MCP server
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="serverName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Server Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            A descriptive name for your MCP server
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormDescription>
                            Brief description of what your server does
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="serverType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Server Type</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setServerType(value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select server language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="typescript">TypeScript</SelectItem>
                              <SelectItem value="python">Python</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the language for your server
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tools" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tools Configuration</CardTitle>
                    <CardDescription>
                      Define the tools your MCP server will provide
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {form.watch('tools')?.map((tool, toolIndex) => (
                      <Card key={toolIndex} className="relative">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Tool {toolIndex + 1}</CardTitle>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeTool(toolIndex)}
                              type="button"
                              disabled={form.watch('tools').length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-0">
                          <FormField
                            control={form.control}
                            name={`tools.${toolIndex}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tool Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                  Use snake_case (e.g., search_database)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`tools.${toolIndex}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormDescription>
                                  What this tool does and when to use it
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium">Parameters</h4>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => addParameter(toolIndex)}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add Parameter
                              </Button>
                            </div>
                            
                            {(tool.parameters || []).map((param, paramIndex) => (
                              <div key={paramIndex} className="border rounded-md p-4 relative">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="absolute top-2 right-2"
                                  onClick={() => removeParameter(toolIndex, paramIndex)}
                                  type="button"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`tools.${toolIndex}.parameters.${paramIndex}.name`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={form.control}
                                    name={`tools.${toolIndex}.parameters.${paramIndex}.type`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select 
                                          onValueChange={field.onChange} 
                                          defaultValue={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="string">String</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="boolean">Boolean</SelectItem>
                                            <SelectItem value="array">Array</SelectItem>
                                            <SelectItem value="object">Object</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                
                                <FormField
                                  control={form.control}
                                  name={`tools.${toolIndex}.parameters.${paramIndex}.description`}
                                  render={({ field }) => (
                                    <FormItem className="mt-4">
                                      <FormLabel>Description</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name={`tools.${toolIndex}.parameters.${paramIndex}.required`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-4">
                                      <FormControl>
                                        <input
                                          type="checkbox"
                                          checked={field.value}
                                          onChange={field.onChange}
                                          className="form-checkbox h-4 w-4"
                                        />
                                      </FormControl>
                                      <FormLabel>Required Parameter</FormLabel>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={addTool}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Another Tool
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : 'Create MCP Server'}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}