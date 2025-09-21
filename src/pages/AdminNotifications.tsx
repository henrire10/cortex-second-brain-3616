import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Shield, Send } from "lucide-react";

const AdminNotifications: React.FC = () => {
  const { isAdmin, loading } = useAdmin();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Basic SEO per page
  useEffect(() => {
    document.title = "Enviar Notificação Global | Admin";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Comunicado para todos os usuários via notificação push");
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = "Comunicado para todos os usuários via notificação push";
      document.head.appendChild(m);
    }
    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = `${window.location.origin}/admin/notifications`;
  }, []);

  const handleSend = async () => {
    if (!message.trim()) {
      toast({ title: "Mensagem vazia", description: "Escreva o texto do comunicado." });
      return;
    }
    try {
      setSending(true);
      const { data, error } = await supabase.functions.invoke("send-broadcast-notification", {
        body: { message },
      });
      if (error) throw error;
      toast({
        title: "Envio iniciado",
        description: `Total: ${data?.total ?? 0} | Sucesso: ${data?.success ?? 0} | Falhas: ${data?.fail ?? 0}`,
      });
      setMessage("");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Falha no envio", description: e?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Acesso negado</h2>
            <p className="text-muted-foreground">Apenas administradores podem enviar notificações globais.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">Comunicado para Todos os Usuários</h1>
          <p className="text-muted-foreground mt-1">Escreva a mensagem e envie como notificação push para todos os usuários opt-in.</p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Mensagem da Notificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite aqui o comunicado que será enviado via push..."
              rows={8}
            />
            <Button onClick={handleSend} disabled={sending} className="w-full">
              <Send className="mr-2" />
              {sending ? "Enviando..." : "Enviar para Todos os Usuários"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AdminNotifications;
