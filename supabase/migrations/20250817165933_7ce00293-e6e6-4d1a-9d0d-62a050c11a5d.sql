-- ✅ CORREÇÃO CRÍTICA: Remover auto-aprovação dos treinos do usuário 'w'
-- Reverter treinos auto-aprovados para pending_approval

UPDATE daily_workouts 
SET 
  approval_status = 'pending_approval',
  status = 'pending',
  approved_by = NULL,
  approved_at = NULL
WHERE user_id = '0511bcbf-57aa-49ff-8836-ec88064d000a'
  AND approval_status = 'approved'
  AND approved_by IS NULL;

-- Log da correção
INSERT INTO system_logs (log_level, message) 
VALUES ('CRITICAL', '🚨 CORREÇÃO APLICADA: Treinos do usuário w revertidos para pending_approval. Auto-aprovação removida com sucesso.');