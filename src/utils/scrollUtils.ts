
/**
 * Utilitário para scroll que funciona corretamente em mobile e desktop
 * Em mobile, o scroll é controlado pelo elemento #root devido às regras CSS
 * Em desktop, o scroll é controlado pelo window
 */

export const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  // Detectar se estamos em mobile verificando se o body tem overflow hidden
  const isMobile = window.innerWidth < 768;
  const bodyOverflow = window.getComputedStyle(document.body).overflow;
  
  if (isMobile && bodyOverflow === 'hidden') {
    // Em mobile, fazer scroll no elemento #root
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.scrollTo({ top: 0, behavior });
    }
  } else {
    // Em desktop, usar window.scrollTo
    window.scrollTo({ top: 0, behavior });
  }
};

export const scrollToTopInstant = () => {
  scrollToTop('auto');
};

export const scrollToTopSmooth = () => {
  scrollToTop('smooth');
};
