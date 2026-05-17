import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useOnboardUser } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { motion } from "framer-motion";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const onboardSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  displayName: z.string().min(1).max(60),
});

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const onboardMutation = useOnboardUser();

  const form = useForm<z.infer<typeof onboardSchema>>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      username: user?.username || "",
      displayName: user?.fullName || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof onboardSchema>) => {
    try {
      await onboardMutation.mutateAsync({
        data: values
      });
      setLocation("/home");
    } catch (err: any) {
      if (err.message?.includes("Username")) {
        form.setError("username", { message: "Username already taken" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden dark">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-3xl p-8 relative z-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Claim your identity</h1>
          <p className="text-muted-foreground">This is how you'll appear on the grid.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
                      <Input placeholder="neon_rider" className="pl-8 bg-input border-border" {...field} data-testid="input-username" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Neon Rider" className="bg-input border-border" {...field} data-testid="input-displayname" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 text-lg rounded-xl bg-gradient-to-r from-primary to-[#06b6d4] hover:opacity-90 transition-opacity border-0"
              disabled={onboardMutation.isPending}
              data-testid="button-complete-onboarding"
            >
              {onboardMutation.isPending ? "Connecting..." : "Enter Squawk"}
            </Button>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
