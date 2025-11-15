# Design System Documentation

## Overview

This design system provides a consistent, modular set of components and design tokens for the YouTube Viral Clipper application. It's built with React, TypeScript, and Tailwind CSS.

## Design Tokens

### Colors

The design system uses a comprehensive color palette:

- **Primary**: Blue tones for main actions and branding
- **Secondary**: Neutral grays for secondary elements
- **Success**: Green for positive states
- **Warning**: Yellow/Orange for warnings
- **Error**: Red for errors
- **Neutral**: Gray scale for text and backgrounds
- **Viral**: Yellow/Gold for viral score indicators

### Typography

- **Font Family**: System font stack for optimal performance
- **Font Sizes**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl
- **Font Weights**: normal (400), medium (500), semibold (600), bold (700)

### Spacing

Consistent 4px/8px spacing scale:
- 1 = 4px
- 2 = 8px
- 4 = 16px
- 6 = 24px
- 8 = 32px
- etc.

### Shadows

Elevation system with multiple shadow levels:
- sm: Subtle shadow
- base: Default card shadow
- md: Medium elevation
- lg: Large elevation
- xl: Extra large elevation
- 2xl: Maximum elevation

## Components

### Layout Components

#### Layout
Main layout wrapper that combines Sidebar, Header, and Content.

```tsx
import { Layout } from '../design-system';

<Layout>
  <YourPageContent />
</Layout>
```

#### Sidebar
Left navigation sidebar with logo, menu items, and user profile.

#### Header
Top header bar with search, notifications, and user menu.

### UI Components

#### Card
Container component with optional header, body, and footer sections.

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '../design-system';

<Card hover>
  <CardHeader>
    <h2>Title</h2>
  </CardHeader>
  <CardBody>
    Content here
  </CardBody>
  <CardFooter>
    Actions here
  </CardFooter>
</Card>
```

**Props:**
- `padding`: 'none' | 'sm' | 'md' | 'lg' (default: 'md')
- `hover`: boolean - Adds hover shadow effect
- `className`: Additional CSS classes

#### Button
Versatile button component with multiple variants and sizes.

```tsx
import { Button } from '../design-system';

<Button variant="primary" size="md" loading={isLoading}>
  Click Me
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean - Shows loading spinner
- `icon`: ReactNode - Icon element
- `iconPosition`: 'left' | 'right'
- `disabled`: boolean

#### Input
Form input with label, error states, and icon support.

```tsx
import { Input } from '../design-system';

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  leftIcon={<FiMail />}
/>
```

**Props:**
- `label`: string
- `error`: string - Error message
- `helperText`: string - Helper text
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `variant`: 'default' | 'search'
- Standard input props

#### Badge
Status badge component for labels and indicators.

```tsx
import { Badge } from '../design-system';

<Badge variant="success" size="md" icon={<FiCheck />}>
  Active
</Badge>
```

**Props:**
- `variant`: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'viral'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: ReactNode

#### ProgressBar
Animated progress bar with variants.

```tsx
import { ProgressBar } from '../design-system';

<ProgressBar
  value={75}
  max={100}
  variant="primary"
  showLabel
  label="Processing..."
/>
```

**Props:**
- `value`: number
- `max`: number (default: 100)
- `variant`: 'primary' | 'success' | 'warning' | 'error'
- `showLabel`: boolean
- `label`: string
- `size`: 'sm' | 'md' | 'lg'

#### MetricCard
Dashboard metric card with value, trend, and icon.

```tsx
import { MetricCard } from '../design-system';

<MetricCard
  title="Total Clips"
  value={125}
  trend={{ value: 12, isPositive: true, label: "vs last month" }}
  icon={<FiFilm />}
  iconColor="primary"
/>
```

**Props:**
- `title`: string
- `value`: string | number
- `trend`: { value: number, isPositive: boolean, label?: string }
- `icon`: ReactNode
- `iconColor`: string

#### StatusIndicator
Color-coded status indicator for jobs and processes.

```tsx
import { StatusIndicator } from '../design-system';

<StatusIndicator status="completed" size="md" />
```

**Props:**
- `status`: string (completed, processing, failed, etc.)
- `size`: 'sm' | 'md' | 'lg'

#### EmptyState
Empty state component for when no data is available.

```tsx
import { EmptyState } from '../design-system';

<EmptyState
  icon={<FiList />}
  title="No clips yet"
  description="Create your first job to generate clips"
  action={{
    label: "Go to Dashboard",
    onClick: () => navigate('/dashboard')
  }}
/>
```

**Props:**
- `icon`: ReactNode
- `title`: string
- `description`: string
- `action`: { label: string, onClick: () => void }

#### Modal
Modal dialog component with backdrop and animations.

```tsx
import { Modal } from '../design-system';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="lg"
>
  Modal content
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `showCloseButton`: boolean
- `footer`: ReactNode

## Usage Examples

### Complete Page Example

```tsx
import { Layout, Card, Button, Input, MetricCard } from '../design-system';

const Dashboard = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-4 gap-6">
          <MetricCard title="Clips" value={125} icon={<FiFilm />} />
          <MetricCard title="Jobs" value={10} icon={<FiList />} />
          <MetricCard title="Success" value="95%" icon={<FiCheck />} />
          <MetricCard title="Active" value={3} icon={<FiPlay />} />
        </div>

        <Card>
          <CardHeader>
            <h2>Create New Job</h2>
          </CardHeader>
          <CardBody>
            <Input label="YouTube URL" placeholder="https://..." />
          </CardBody>
          <CardFooter>
            <Button variant="primary">Submit</Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};
```

## Best Practices

1. **Consistency**: Always use design system components instead of custom styles
2. **Accessibility**: Components include proper ARIA attributes and keyboard navigation
3. **Responsive**: All components are mobile-responsive
4. **Performance**: Components are optimized and use CSS-in-JS efficiently
5. **Type Safety**: All components are fully typed with TypeScript

## Customization

### Extending Colors

Add custom colors to `tailwind.config.js`:

```js
colors: {
  // ... existing colors
  custom: {
    500: '#your-color',
  }
}
```

### Creating New Components

Follow the existing component patterns:
1. Use TypeScript interfaces for props
2. Support className for custom styling
3. Include proper accessibility attributes
4. Use design tokens for spacing, colors, etc.
5. Export from `design-system/index.ts`

## Migration Guide

### From Old Navigation to Layout

**Before:**
```tsx
<Navigation />
<YourPage />
```

**After:**
```tsx
<Layout>
  <YourPage />
</Layout>
```

### From Old Cards to New Card Component

**Before:**
```tsx
<div className="bg-white shadow rounded-lg p-6">
  Content
</div>
```

**After:**
```tsx
<Card>
  <CardBody>
    Content
  </CardBody>
</Card>
```

## Contributing

When adding new components:
1. Create component in appropriate directory (`ui/` or `layout/`)
2. Add TypeScript types
3. Export from `design-system/index.ts`
4. Update this documentation
5. Add usage examples

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Icons](https://react-icons.github.io/react-icons/)
- [Headless UI](https://headlessui.dev/)

