
-- AÇÃO 3: Limpeza do Banco de Dados
-- Atualizar todos os treinos com status 'pending' para ter approval_status 'pending_approval'
UPDATE daily_workouts 
SET approval_status = 'pending_approval'
WHERE status = 'pending' 
AND (approval_status IS NULL OR approval_status != 'pending_approval');

-- Log da operação para auditoria
INSERT INTO system_logs (log_level, message) 
VALUES ('INFO', 'Limpeza do banco: Atualizados treinos com status pending para approval_status pending_approval - ' || 
        (SELECT COUNT(*) FROM daily_workouts WHERE status = 'pending' AND approval_status = 'pending_approval'));
