-- Inserir dados de teste para medidas corporais (sem ON CONFLICT)
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
    now()
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
    now() - interval '1 day'
);