import { Youtube, Plus, Trash2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { YouTubeAccount } from "@/types";

type YouTubeAccountsCardProps = {
  accounts: YouTubeAccount[];
  onDeleteAccount: (id: number) => void;
  onConnect: () => void;
  isConnecting: boolean;
};

export function YouTubeAccountsCard({
  accounts,
  onDeleteAccount,
  onConnect,
  isConnecting,
}: YouTubeAccountsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="size-5 text-destructive" />
          YouTube Accounts
        </CardTitle>
        <CardDescription>
          Connect your YouTube account to upload clips directly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={account.channel_thumbnail} />
                    <AvatarFallback>
                      {account.channel_title?.[0]?.toUpperCase() || "Y"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {account.channel_title || account.channel_id}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={account.is_active ? "default" : "secondary"}
                        className={account.is_active ? "bg-success" : ""}
                      >
                        {account.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {account.is_verified && (
                        <Badge variant="outline">Verified</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => onDeleteAccount(account.id)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No YouTube accounts connected yet.
          </p>
        )}
        <Button
          onClick={onConnect}
          loading={isConnecting}
          icon={<Plus className="size-4" />}
        >
          Connect YouTube Account
        </Button>
      </CardContent>
    </Card>
  );
}
