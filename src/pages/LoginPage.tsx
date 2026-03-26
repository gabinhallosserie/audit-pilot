import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      navigate("/dashboard");
    } else {
      toast.error("Identifiants incorrects", {
        description: "Utilisez l'un des comptes de démonstration ci-dessous.",
      });
    }
  };

  const quickLogin = (email: string) => {
    if (login(email, "demo")) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-teal flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-9 h-9 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-foreground tracking-tight">
            AUDIT.IO
          </h1>
          <p className="text-primary-foreground/60 text-sm mt-1">
            Plateforme SaaS de gestion d'audits
          </p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-teal hover:bg-teal-dark text-primary-foreground font-semibold">
                Se connecter
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                Comptes de démonstration
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => quickLogin("marie.dupont@audit.io")}
                  className="w-full text-left p-3 rounded-lg border hover:border-teal hover:bg-teal-light transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Marie Dupont</p>
                      <p className="text-xs text-muted-foreground">marie.dupont@audit.io · Rôle Audité</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-teal transition-colors" />
                  </div>
                </button>
                <button
                  onClick={() => quickLogin("jean.martin@audit.io")}
                  className="w-full text-left p-3 rounded-lg border hover:border-teal hover:bg-teal-light transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Jean Martin</p>
                      <p className="text-xs text-muted-foreground">jean.martin@audit.io · Rôle Auditeur</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-teal transition-colors" />
                  </div>
                </button>
                <button
                  onClick={() => quickLogin("admin@audit.io")}
                  className="w-full text-left p-3 rounded-lg border hover:border-teal hover:bg-teal-light transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Administrateur</p>
                      <p className="text-xs text-muted-foreground">admin@audit.io · Rôle Admin</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-teal transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-4">
          <button onClick={() => navigate("/register")} className="text-primary-foreground/70 hover:text-primary-foreground text-sm underline underline-offset-2 transition-colors">
            Créer un compte
          </button>
        </div>

        <p className="text-center text-primary-foreground/40 text-xs mt-4">
          POC Phase 1 — Données de démonstration
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
