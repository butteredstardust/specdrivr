'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  CheckCircledIcon,
  InfoCircledIcon,
  ExclamationTriangleIcon,
  PersonIcon,
  TargetIcon,
  StarIcon,
} from '@radix-ui/react-icons';

export default function ComponentShowcase() {
  const showToast = () => {
    toast.success('This is a toast notification using Sonner!');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TargetIcon className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">Specdrivr UI</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-6">
              Professional component library built with shadcn/ui
            </p>
            <div className="flex items-center justify-center gap-3">
              <Badge variant="default">shadcn/ui</Badge>
              <Badge variant="outline">Tailwind CSS</Badge>
              <Badge variant="secondary">TypeScript</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12 space-y-16">
        {/* Color Palette */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Design System Colors</h2>
          <Card>
            <CardHeader>
              <CardTitle>Brand & Status Colors</CardTitle>
              <CardDescription>Design tokens defined in globals.css</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-[oklch(0.627_0.265_303.9)]" />
                  <p className="text-sm font-medium">Brand Primary</p>
                  <p className="text-xs text-muted-foreground">oklch(0.627 0.265 303.9)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-[oklch(0.446_0.3_303.9)]" />
                  <p className="text-sm font-medium">Brand Secondary</p>
                  <p className="text-xs text-muted-foreground">oklch(0.446 0.3 303.9)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-[oklch(0.627_0.194_149.2)]" />
                  <p className="text-sm font-medium">Status Done</p>
                  <p className="text-xs text-muted-foreground">oklch(0.627 0.194 149.2)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-[oklch(0.769_0.188_70)]" />
                  <p className="text-sm font-medium">Status Blocked</p>
                  <p className="text-xs text-muted-foreground">oklch(0.769 0.188 70)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-[oklch(0.627_0.258_23.5)]" />
                  <p className="text-sm font-medium">Status Failed</p>
                  <p className="text-xs text-muted-foreground">oklch(0.627 0.258 23.5)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Buttons</h2>
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>Different styles and sizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">Variants</Label>
                <div className="flex flex-wrap gap-3">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="mb-3 block">Sizes</Label>
                <div className="flex items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="mb-3 block">With Icons</Label>
                <div className="flex flex-wrap gap-3">
                  <Button><RocketIcon className="mr-2 h-4 w-4" />Launch</Button>
                  <Button variant="outline"><GearIcon className="mr-2 h-4 w-4" />Settings</Button>
                  <Button variant="secondary"><StarIcon className="mr-2 h-4 w-4" />Favorite</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Badges</h2>
          <Card>
            <CardHeader>
              <CardTitle>Status Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Card Examples */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description text</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Card body content goes here. Use for grouping related information.</p>
              </CardContent>
            </Card>
            <Card bordered variant="raised">
              <CardHeader>
                <CardTitle>Raised Card</CardTitle>
                <CardDescription>With elevated shadow</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card has special styling with border and raised variant.</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Action Button</Button>
              </CardFooter>
            </Card>
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TargetIcon className="h-5 w-5 text-primary" />
                  With Icon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Cards can contain icons from Radix UI or Lucide.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Input & Form */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Form Elements</h2>
          <Card>
            <CardHeader>
              <CardTitle>Input Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
              <Button>Submit Form</Button>
            </CardContent>
          </Card>
        </section>

        {/* Table */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Table</h2>
          <Card>
            <CardHeader>
              <CardTitle>Data Table</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Project Alpha</TableCell>
                    <TableCell><Badge variant="default">Active</Badge></TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Project Beta</TableCell>
                    <TableCell><Badge variant="secondary">In Progress</Badge></TableCell>
                    <TableCell className="text-right">67%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Project Gamma</TableCell>
                    <TableCell><Badge variant="outline">Planned</Badge></TableCell>
                    <TableCell className="text-right">0%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* Progress */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Progress Indicators</h2>
          <Card>
            <CardHeader>
              <CardTitle>Progress Bars</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Complete</Label>
                  <span className="text-sm text-muted-foreground">100%</span>
                </div>
                <Progress value={100} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Label>In Progress</Label>
                  <span className="text-sm text-muted-foreground">67%</span>
                </div>
                <Progress value={67} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Started</Label>
                  <span className="text-sm text-muted-foreground">25%</span>
                </div>
                <Progress value={25} />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Alerts */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Alerts</h2>
          <div className="space-y-4">
            <Alert>
              <InfoCircledIcon className="h-4 w-4" />
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>This is an informational alert message.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Something went wrong. Please try again.</AlertDescription>
            </Alert>
            <Alert variant="default" className="border-green-500/50 text-green-700 dark:text-green-400">
              <CheckCircledIcon className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Your changes have been saved successfully.</AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Avatar */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Avatars</h2>
          <Card>
            <CardHeader>
              <CardTitle>User Avatars</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="https://api.dicebear.com/7.x/shapes/svg?seed=admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage src="https://api.dicebear.com/7.x/shapes/svg?seed=elena" />
                  <AvatarFallback>ER</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>JC</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">Admin</AvatarFallback>
                </Avatar>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Skeleton Loading */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Skeleton Loading</h2>
          <Card>
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </section>

        {/* Toast Demo */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Notifications</h2>
          <Card>
            <CardHeader>
              <CardTitle>Toast Notifications</CardTitle>
              <CardDescription>Created using Sonner</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={showToast}>Show Toast</Button>
            </CardContent>
          </Card>
        </section>

        {/* Separator */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Separators</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p>Content above</p>
                <Separator />
                <p>Content below</p>
                <div className="h-4" />
                <Separator orientation="vertical" className="h-16" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pxlkit Integration Notice */}
        <section>
          <Card className="border-dashed border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StarIcon className="h-5 w-5 text-yellow-500" />
                Pxlkit Components
              </CardTitle>
              <CardDescription>These packages are installed and ready to integrate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">@pxlkit/core</Badge>
                <Badge variant="outline">@pxlkit/effects</Badge>
                <Badge variant="outline">@pxlkit/feedback</Badge>
                <Badge variant="outline">@pxlkit/gamification</Badge>
                <Badge variant="outline">@pxlkit/social</Badge>
                <Badge variant="outline">@pxlkit/ui</Badge>
                <Badge variant="outline">@pxlkit/weather</Badge>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Pxlkit components can be integrated for gamification, social features, feedback systems, and effects.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Navigation */}
        <section className="text-center">
          <h2 className="text-2xl font-bold mb-6">Ready to Explore?</h2>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <a href="/debug">
                <GearIcon className="mr-2 h-5 w-5" />
                Debug Dashboard
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/login">
                <PersonIcon className="mr-2 h-5 w-5" />
                Login
              </a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="M12 15l-3-3a22 22 0 0 1 2-2.95c.7-.7 1.87-.7 2.59 0 .7.7.7 1.88 0 2.59L12 15z"/>
      <path d="m9 12 4 4"/>
      <path d="m12 16 4-4"/>
      <path d="M15 9l-3 3"/>
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

