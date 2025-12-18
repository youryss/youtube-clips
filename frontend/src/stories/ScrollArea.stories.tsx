import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const meta: Meta<typeof ScrollArea> = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const tags = Array.from({ length: 50 }).map((_, i, a) => `Tag ${i + 1}`);

const items = [
  "Dashboard",
  "Jobs",
  "Clips",
  "Settings",
  "Profile",
  "Notifications",
  "Integrations",
  "API Keys",
  "Team",
  "Billing",
  "Help",
  "Documentation",
];

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Menu</h4>
        {items.map((item) => (
          <div key={item}>
            <div className="text-sm">{item}</div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {tags.slice(0, 20).map((tag) => (
          <div
            key={tag}
            className="shrink-0 rounded-md border px-3 py-1 text-sm"
          >
            {tag}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

export const LongContent: Story = {
  render: () => (
    <ScrollArea className="h-[300px] w-[400px] rounded-md border p-4">
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Lorem Ipsum</h4>
        <p className="text-sm text-muted-foreground">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>
        <p className="text-sm text-muted-foreground">
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
          dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
          proident, sunt in culpa qui officia deserunt mollit anim id est
          laborum.
        </p>
        <p className="text-sm text-muted-foreground">
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae
          ab illo inventore veritatis et quasi architecto beatae vitae dicta
          sunt explicabo.
        </p>
        <p className="text-sm text-muted-foreground">
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut
          fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem
          sequi nesciunt.
        </p>
        <p className="text-sm text-muted-foreground">
          Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet,
          consectetur, adipisci velit, sed quia non numquam eius modi tempora
          incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
        </p>
        <p className="text-sm text-muted-foreground">
          Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis
          suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?
        </p>
      </div>
    </ScrollArea>
  ),
};

export const JobsList: Story = {
  render: () => (
    <ScrollArea className="h-[400px] w-[350px] rounded-lg border">
      <div className="p-4">
        <h4 className="mb-4 font-medium">Recent Jobs</h4>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="mb-4 rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Job #{i + 1}</span>
              <span
                className={`text-sm ${
                  i % 3 === 0
                    ? "text-success"
                    : i % 3 === 1
                    ? "text-warning"
                    : "text-destructive"
                }`}
              >
                {i % 3 === 0
                  ? "Completed"
                  : i % 3 === 1
                  ? "Processing"
                  : "Failed"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Video title example {i + 1}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              {i * 2} clips generated
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
