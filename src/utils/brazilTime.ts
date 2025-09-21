/**
 * Utilitário centralizado para cálculos de data/hora do Brasil
 * Elimina inconsistências de fuso horário que causam bugs no calendário
 */

/**
 * Obtém a data atual do Brasil de forma consistente
 * @returns Date object com horário do Brasil
 */
export const getBrazilCurrentDate = (): Date => {
  const now = new Date();
  // Usar Intl.DateTimeFormat para conversão precisa
  const brazilTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);

  const year = parseInt(brazilTime.find(part => part.type === 'year')?.value || '2024');
  const month = parseInt(brazilTime.find(part => part.type === 'month')?.value || '1') - 1; // JS months are 0-indexed
  const day = parseInt(brazilTime.find(part => part.type === 'day')?.value || '1');
  const hour = parseInt(brazilTime.find(part => part.type === 'hour')?.value || '0');
  const minute = parseInt(brazilTime.find(part => part.type === 'minute')?.value || '0');
  const second = parseInt(brazilTime.find(part => part.type === 'second')?.value || '0');

  return new Date(year, month, day, hour, minute, second);
};

/**
 * Obtém a data atual do Brasil como string no formato YYYY-MM-DD
 * @returns string no formato YYYY-MM-DD
 */
export const getBrazilCurrentDateString = (): string => {
  const brazilDate = getBrazilCurrentDate();
  const year = brazilDate.getFullYear();
  const month = String(brazilDate.getMonth() + 1).padStart(2, '0');
  const day = String(brazilDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converte uma data para o horário do Brasil
 * @param date Date a ser convertida
 * @returns Date convertida para horário do Brasil
 */
export const convertToBrazilTime = (date: Date): Date => {
  const brazilTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const year = parseInt(brazilTime.find(part => part.type === 'year')?.value || '2024');
  const month = parseInt(brazilTime.find(part => part.type === 'month')?.value || '1') - 1;
  const day = parseInt(brazilTime.find(part => part.type === 'day')?.value || '1');
  const hour = parseInt(brazilTime.find(part => part.type === 'hour')?.value || '0');
  const minute = parseInt(brazilTime.find(part => part.type === 'minute')?.value || '0');
  const second = parseInt(brazilTime.find(part => part.type === 'second')?.value || '0');

  return new Date(year, month, day, hour, minute, second);
};

/**
 * Formata uma data no formato YYYY-MM-DD usando timezone do Brasil
 */
export const formatBrazilDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

/**
 * Calcula data para um dia específico da semana com offset de semanas
 * @param dayIndex Índice do dia (0=Dom, 1=Seg, 2=Ter, etc.)
 * @param weekOffset Offset de semanas (0=atual, 1=próxima, -1=anterior)
 * @returns string no formato YYYY-MM-DD
 */
export const getBrazilDateForDay = (dayIndex: number, weekOffset: number = 0): string => {
  const timestamp = new Date().toISOString();
  console.log(`🇧🇷 BRAZIL TIME CALC [${timestamp}]:`, {
    dayIndex,
    weekOffset,
    dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayIndex]
  });

  // Data atual do Brasil
  const todayBrazil = getBrazilCurrentDate();
  console.log(`📅 BRAZIL CURRENT DATE:`, {
    todayBrazil: todayBrazil.toISOString(),
    todayDate: todayBrazil.toLocaleDateString('pt-BR'),
    todayDayOfWeek: todayBrazil.getDay(),
    todayDayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][todayBrazil.getDay()]
  });

  // Calcular início da semana (Segunda-feira)
  const currentDayOfWeek = todayBrazil.getDay(); // 0=Dom, 1=Seg, etc.
  let daysToMonday;
  if (currentDayOfWeek === 0) {
    // Se hoje é Domingo, voltar 6 dias para pegar Segunda da semana passada
    daysToMonday = 6;
  } else {
    // Se hoje é Seg-Sáb, voltar (currentDayOfWeek - 1) dias
    daysToMonday = currentDayOfWeek - 1;
  }

  console.log(`🔍 MONDAY CALCULATION:`, {
    currentDayOfWeek,
    todayDayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][currentDayOfWeek],
    daysToMonday,
    logic: currentDayOfWeek === 0 ? 'Domingo -> voltar 6 dias' : `${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][currentDayOfWeek]} -> voltar ${daysToMonday} dias`
  });

  // Data da Segunda-feira da semana atual (normalizada para meio-dia)
  const mondayThisWeek = new Date(todayBrazil);
  mondayThisWeek.setDate(todayBrazil.getDate() - daysToMonday);
  mondayThisWeek.setHours(12, 0, 0, 0);

  console.log(`📍 MONDAY THIS WEEK:`, {
    monday: mondayThisWeek.toLocaleDateString('pt-BR'),
    mondayDayOfWeek: mondayThisWeek.getDay(),
    expected: 1,
    validation: mondayThisWeek.getDay() === 1 ? '✅ CORRETO' : '❌ ERRO'
  });

  // Aplicar offset de semanas
  const mondayTargetWeek = new Date(mondayThisWeek);
  mondayTargetWeek.setDate(mondayThisWeek.getDate() + weekOffset * 7);
  mondayTargetWeek.setHours(12, 0, 0, 0);

  console.log(`🎯 MONDAY TARGET WEEK (offset ${weekOffset}):`, {
    mondayTarget: mondayTargetWeek.toLocaleDateString('pt-BR'),
    mondayTargetDayOfWeek: mondayTargetWeek.getDay()
  });

  // Calcular data específica do dia (sempre meio-dia para evitar drift UTC)
  let targetDate = new Date(mondayTargetWeek);
  if (dayIndex === 0) {
    // Domingo = Sábado + 1 dia (fim da semana)
    targetDate.setDate(mondayTargetWeek.getDate() + 6);
  } else {
    // Segunda(1) = Monday + 0, Terça(2) = Monday + 1, etc.
    targetDate.setDate(mondayTargetWeek.getDate() + (dayIndex - 1));
  }
  targetDate.setHours(12, 0, 0, 0);

  // Formatar usando timezone do Brasil (sem usar toISOString)
  const dateString = formatBrazilDate(targetDate);

  // Calcular dia da semana no fuso Brasil para validação
  const calculatedBrazilDate = convertToBrazilTime(targetDate);
  const calculatedDayOfWeek = calculatedBrazilDate.getDay();

  console.log(`✅ BRAZIL RESULT:`, {
    dayIndex,
    dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayIndex],
    calculatedDate: dateString,
    calculatedBrazilDate: calculatedBrazilDate.toLocaleDateString('pt-BR'),
    calculatedDayOfWeek,
    calculatedDayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][calculatedDayOfWeek],
    matches: calculatedDayOfWeek === dayIndex ? '✅ CORRETO' : '❌ ERRO',
    expectedMapping: `${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayIndex]}(${dayIndex}) → ${dateString}`
  });

  if (calculatedDayOfWeek !== dayIndex) {
    console.error(`🚨 BRAZIL TIME ERROR:`, {
      esperado: `${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayIndex]}(${dayIndex})`,
      calculado: `${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][calculatedDayOfWeek]}(${calculatedDayOfWeek})`,
      data: dateString,
      horarioBrasil: todayBrazil.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    });
  }

  return dateString;
};

/**
 * Verifica se é horário crítico (próximo à mudança de dia)
 * @returns boolean indicando se está em horário crítico
 */
export const isCriticalTimeHour = (): boolean => {
  const brazilTime = getBrazilCurrentDate();
  const hour = brazilTime.getHours();
  return hour >= 21 || hour <= 2;
};

/**
 * Log temporal para debugging em horários críticos
 * @param context Contexto da operação
 * @param data Dados adicionais para log
 */
export const logCriticalTime = (context: string, data?: any): void => {
  if (isCriticalTimeHour()) {
    const brazilTime = getBrazilCurrentDate();
    const timeString = brazilTime.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    console.log(`⏰ CRITICAL TIME [${timeString}] - ${context}:`, data);
  }
};
