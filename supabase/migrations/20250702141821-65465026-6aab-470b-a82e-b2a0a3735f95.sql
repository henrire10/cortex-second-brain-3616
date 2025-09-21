-- Inserir dados de teste para medidas corporais
INSERT INTO body_measurements (
    user_id, 
    weight, 
    height, 
    body_fat, 
    muscle_mass, 
    chest, 
    waist_navel, 
    right_arm_flexed, 
    right_thigh_proximal,
    date
) VALUES 
(
    '8c7cd32c-756a-4840-b44d-f014da474efa',
    65.5,
    160,
    18.5,
    45.2,
    92,
    75,
    32,
    58,
    '2025-07-02'
),
(
    '6183bc16-e951-4eae-9ac7-87e93853b25b',
    62.0,
    160,
    17.8,
    46.5,
    90,
    72,
    31,
    56,
    '2025-07-01'
)
ON CONFLICT (user_id, date) DO UPDATE SET
    weight = EXCLUDED.weight,
    height = EXCLUDED.height,
    body_fat = EXCLUDED.body_fat,
    muscle_mass = EXCLUDED.muscle_mass,
    chest = EXCLUDED.chest,
    waist_navel = EXCLUDED.waist_navel,
    right_arm_flexed = EXCLUDED.right_arm_flexed,
    right_thigh_proximal = EXCLUDED.right_thigh_proximal;