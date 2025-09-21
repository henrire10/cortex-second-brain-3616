
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EnhancedBodyMeasurementsModule } from "@/components/questionnaire/EnhancedBodyMeasurementsModule";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MeasurementEvolution } from "@/components/MeasurementEvolution";
import { 
  calculateBodyFat, 
  calculateMuscleMass, 
  canCalculateBodyFat,
  type BodyFatMeasurements 
} from "@/utils/bodyFatCalculator";

export default function Measurements() {
  const navigate = useNavigate();
  const { user, profile, addPoints } = useAuth();
  const userGender = (profile?.gender as "masculino" | "feminino") || "masculino";
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMeasurements = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .order("date", { ascending: false }); // ✅ FIXADO: order by created_at first, then date

      if (error) throw error;
      console.log("🔍 AUDITORIA - Medições carregadas do banco:", data);
      
      // ✅ BACKFILL: Check if latest measurement needs body fat calculation
      if (data && data.length > 0) {
        const latestMeasurement = data[0];
        const needsBackfill = !latestMeasurement.body_fat && 
                              latestMeasurement.weight && 
                              latestMeasurement.height &&
                              (!latestMeasurement.neck && profile?.profile_data?.medidas_pescoco);

        if (needsBackfill) {
          console.log("🔄 BACKFILL: Calculating missing body fat for latest measurement");
          
          const neckFromProfile = profile?.profile_data?.medidas_pescoco;
          const bodyFatMeasurements: BodyFatMeasurements = {
            gender: userGender,
            height: latestMeasurement.height,
            weight: latestMeasurement.weight,
            neck: neckFromProfile,
            waist: latestMeasurement.waist_navel,
            hips: latestMeasurement.hips,
            abdomen: latestMeasurement.waist_navel
          };

          if (canCalculateBodyFat(bodyFatMeasurements)) {
            const calculatedBodyFat = calculateBodyFat(bodyFatMeasurements);
            if (calculatedBodyFat !== null) {
              const calculatedMuscleMass = calculateMuscleMass(latestMeasurement.weight, calculatedBodyFat);
              
              // Update the measurement in the database
              const { error: updateError } = await supabase
                .from("body_measurements")
                .update({
                  neck: neckFromProfile,
                  body_fat: calculatedBodyFat,
                  muscle_mass: calculatedMuscleMass
                })
                .eq("id", latestMeasurement.id);

              if (!updateError) {
                console.log("✅ BACKFILL: Successfully updated measurement with calculated values");
                // Update the local data
                latestMeasurement.neck = neckFromProfile;
                latestMeasurement.body_fat = calculatedBodyFat;
                latestMeasurement.muscle_mass = calculatedMuscleMass;
                
                toast({ 
                  title: "Dados atualizados!", 
                  description: `Gordura corporal calculada: ${calculatedBodyFat.toFixed(1)}%`
                });
              } else {
                console.error("❌ BACKFILL: Error updating measurement:", updateError);
              }
            }
          }
        }
      }
      
      setMeasurements(data || []);
    } catch (err) {
      console.error("Erro ao buscar medidas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeasurements();
  }, [user?.id]);

  const handleSave = async (data: any) => {
    console.log("🚨 AUDITORIA - Dados recebidos do questionário:", data);
    console.log("🔍 AUDITORIA - Valor específico do pescoço (medidas_pescoco):", data.medidas_pescoco);
    console.log("🔍 AUDITORIA - Tipo do valor do pescoço:", typeof data.medidas_pescoco);
    console.log("🔍 AUDITORIA - Valor é zero?", data.medidas_pescoco === 0);
    console.log("🔍 AUDITORIA - Valor é null/undefined?", data.medidas_pescoco == null);
    console.log("🔍 AUDITORIA - Valor é string vazia?", data.medidas_pescoco === "");
    console.log("🔍 AUDITORIA - Valor truthy?", !!data.medidas_pescoco);

    if (!user?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }

    try {
      // Prepare measurement data with explicit null coalescing
      const measurementData = {
        user_id: user.id,
        weight: data.peso !== undefined && data.peso !== null && data.peso !== "" ? Number(data.peso) : null,
        height: data.altura !== undefined && data.altura !== null && data.altura !== "" ? Number(data.altura) : (profile?.height || null),
        body_fat: data.bodyFat !== undefined && data.bodyFat !== null && data.bodyFat !== "" ? Number(data.bodyFat) : null,
        muscle_mass: null,
        waist_navel: data.medidas_barriga !== undefined && data.medidas_barriga !== null && data.medidas_barriga !== "" ? Number(data.medidas_barriga) : null,
        chest: data.medidas_peito !== undefined && data.medidas_peito !== null && data.medidas_peito !== "" ? Number(data.medidas_peito) : null,
        right_arm_flexed: data.medidas_biceps_direito !== undefined && data.medidas_biceps_direito !== null && data.medidas_biceps_direito !== "" ? Number(data.medidas_biceps_direito) : null,
        left_arm_flexed: data.medidas_biceps_esquerdo !== undefined && data.medidas_biceps_esquerdo !== null && data.medidas_biceps_esquerdo !== "" ? Number(data.medidas_biceps_esquerdo) : null,
        right_thigh_proximal: data.medidas_coxa_direita !== undefined && data.medidas_coxa_direita !== null && data.medidas_coxa_direita !== "" ? Number(data.medidas_coxa_direita) : null,
        left_thigh_proximal: data.medidas_coxa_esquerda !== undefined && data.medidas_coxa_esquerda !== null && data.medidas_coxa_esquerda !== "" ? Number(data.medidas_coxa_esquerda) : null,
        neck: data.medidas_pescoco !== undefined && data.medidas_pescoco !== null && data.medidas_pescoco !== "" ? Number(data.medidas_pescoco) : null, // ✅ CORREÇÃO CRÍTICA
        hips: data.medidas_quadril !== undefined && data.medidas_quadril !== null && data.medidas_quadril !== "" ? Number(data.medidas_quadril) : null,
        right_forearm: data.medidas_antebraco_direito !== undefined && data.medidas_antebraco_direito !== null && data.medidas_antebraco_direito !== "" ? Number(data.medidas_antebraco_direito) : null,
        left_forearm: data.medidas_antebraco_esquerdo !== undefined && data.medidas_antebraco_esquerdo !== null && data.medidas_antebraco_esquerdo !== "" ? Number(data.medidas_antebraco_esquerdo) : null,
        right_calf: data.medidas_panturrilha_direita !== undefined && data.medidas_panturrilha_direita !== null && data.medidas_panturrilha_direita !== "" ? Number(data.medidas_panturrilha_direita) : null,
        left_calf: data.medidas_panturrilha_esquerda !== undefined && data.medidas_panturrilha_esquerda !== null && data.medidas_panturrilha_esquerda !== "" ? Number(data.medidas_panturrilha_esquerda) : null,
        notes: data.observacoes || null,
        date: new Date().toISOString(),
      };

      console.log("✅ AUDITORIA - Dados processados para salvamento:");
      console.log("  - neck processado:", measurementData.neck, "(tipo:", typeof measurementData.neck, ")");
      console.log("  - weight processado:", measurementData.weight, "(tipo:", typeof measurementData.weight, ")");
      console.log("  - height processado:", measurementData.height, "(tipo:", typeof measurementData.height, ")");
      console.log("  - waist_navel processado:", measurementData.waist_navel, "(tipo:", typeof measurementData.waist_navel, ")");
      console.log("  - hips processado:", measurementData.hips, "(tipo:", typeof measurementData.hips, ")");
      console.log("📦 AUDITORIA - Objeto completo para salvamento:", measurementData);

      // Try to calculate body fat automatically if not provided and we have enough measurements
      if (!measurementData.body_fat && measurementData.weight && measurementData.height) {
        const bodyFatMeasurements: BodyFatMeasurements = {
          gender: userGender,
          height: measurementData.height,
          weight: measurementData.weight,
          neck: measurementData.neck,
          waist: measurementData.waist_navel,
          hips: measurementData.hips,
          abdomen: measurementData.waist_navel // Use waist as abdomen for US Navy formula
        };

        console.log("🧮 AUDITORIA - Dados para cálculo de gordura corporal:");
        console.log("  - gender:", bodyFatMeasurements.gender);
        console.log("  - height:", bodyFatMeasurements.height);
        console.log("  - weight:", bodyFatMeasurements.weight);
        console.log("  - neck:", bodyFatMeasurements.neck, "(presente?", !!bodyFatMeasurements.neck, ")");
        console.log("  - waist:", bodyFatMeasurements.waist, "(presente?", !!bodyFatMeasurements.waist, ")");
        console.log("  - hips:", bodyFatMeasurements.hips, "(presente?", !!bodyFatMeasurements.hips, ")");

        if (canCalculateBodyFat(bodyFatMeasurements)) {
          console.log("✅ Pode calcular! Executando cálculo...");
          const calculatedBodyFat = calculateBodyFat(bodyFatMeasurements);
          if (calculatedBodyFat !== null) {
            measurementData.body_fat = calculatedBodyFat;
            measurementData.muscle_mass = calculateMuscleMass(measurementData.weight, calculatedBodyFat);
            
            console.log("✅ AUDITORIA - Gordura corporal calculada com sucesso:", calculatedBodyFat);
            
            toast({ 
              title: "Cálculo automático!", 
              description: `Gordura corporal calculada: ${calculatedBodyFat.toFixed(1)}%`,
            });
          } else {
            console.log("❌ AUDITORIA - Cálculo retornou null");
          }
        } else {
          console.log("❌ AUDITORIA - Não é possível calcular (canCalculateBodyFat = false)");
          
          // Debug detalhado do que está faltando
          if (userGender === 'feminino') {
            console.log("👩 Para mulheres, é necessário:");
            console.log("  - Pescoço:", !!bodyFatMeasurements.neck ? "✅" : "❌");
            console.log("  - Cintura:", !!bodyFatMeasurements.waist ? "✅" : "❌");
            console.log("  - Quadril:", !!bodyFatMeasurements.hips ? "✅" : "❌");
          } else {
            console.log("👨 Para homens, é necessário:");
            console.log("  - Pescoço:", !!bodyFatMeasurements.neck ? "✅" : "❌");
            console.log("  - Cintura:", !!bodyFatMeasurements.waist ? "✅" : "❌");
          }
        }
      }

      const { error } = await supabase.from("body_measurements").insert([measurementData]);
      if (error) {
        console.error("❌ AUDITORIA - Erro ao salvar no Supabase:", error);
        throw error;
      }

      console.log("✅ AUDITORIA - Medições salvas com sucesso no banco de dados");

      if (addPoints) addPoints(25);

      toast({ title: "Medidas salvas!", description: "Sua medição foi registrada com sucesso." });
      
      // Refresh measurements data
      fetchMeasurements();
    } catch (err) {
      console.error("Erro ao salvar medidas:", err);
      toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
    }
  };

  const handleBack = () => {
    console.log("Botão voltar clicado");
    console.log("Navigate function:", navigate);
    try {
      navigate("/dashboard");
    } catch (error) {
      console.error("Erro ao navegar:", error);
      // Fallback para window.history
      window.history.back();
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Análise Corporal Completa</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>Voltar</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-4 overflow-y-auto scrollbar-hide min-h-0 [-webkit-overflow-scrolling:touch]">
        <Tabs defaultValue="registrar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registrar">Registrar</TabsTrigger>
            <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          </TabsList>
          
          <TabsContent value="registrar" className="mt-4">
            <EnhancedBodyMeasurementsModule onSaveMeasurements={handleSave} userGender={userGender} />
          </TabsContent>
          
          <TabsContent value="evolucao" className="mt-4">
            <MeasurementEvolution measurements={measurements} loading={loading} userProfile={profile} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
