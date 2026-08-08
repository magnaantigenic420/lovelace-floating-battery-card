import type { NormalizedFloatingBatteryCardConfig } from './types';
import { cssDimension } from './utils';

function offset(
  value: number | string,
  edge: number | string,
  safeArea: string,
  useSafeArea: boolean,
): string {
  const parts = [cssDimension(value), cssDimension(edge)];
  if (useSafeArea) parts.push(`env(${safeArea}, 0px)`);
  return `calc(${parts.join(' + ')})`;
}

export function positionStyles(config: NormalizedFloatingBatteryCardConfig): Record<string, string> {
  const { position } = config;
  if (position.mode === 'inline') {
    return { position: 'relative', inset: 'auto', transform: 'none' };
  }

  const styles: Record<string, string> = {
    position: 'fixed',
    zIndex: String(position.z_index),
  };
  const xLeft = offset(
    position.offset_x,
    position.edge_margin,
    'safe-area-inset-left',
    position.safe_area,
  );
  const xRight = offset(
    position.offset_x,
    position.edge_margin,
    'safe-area-inset-right',
    position.safe_area,
  );
  const yTop = offset(
    position.offset_y,
    position.edge_margin,
    'safe-area-inset-top',
    position.safe_area,
  );
  const yBottom = offset(
    position.offset_y,
    position.edge_margin,
    'safe-area-inset-bottom',
    position.safe_area,
  );

  switch (position.anchor) {
    case 'top-left':
      styles.left = xLeft;
      styles.top = yTop;
      break;
    case 'top-center':
      styles.left = `calc(50% + ${cssDimension(position.offset_x)})`;
      styles.top = yTop;
      styles.transform = 'translateX(-50%)';
      break;
    case 'top-right':
      styles.right = xRight;
      styles.top = yTop;
      break;
    case 'middle-left':
      styles.left = xLeft;
      styles.top = `calc(50% + ${cssDimension(position.offset_y)})`;
      styles.transform = 'translateY(-50%)';
      break;
    case 'center':
      styles.left = `calc(50% + ${cssDimension(position.offset_x)})`;
      styles.top = `calc(50% + ${cssDimension(position.offset_y)})`;
      styles.transform = 'translate(-50%, -50%)';
      break;
    case 'middle-right':
      styles.right = xRight;
      styles.top = `calc(50% + ${cssDimension(position.offset_y)})`;
      styles.transform = 'translateY(-50%)';
      break;
    case 'bottom-left':
      styles.left = xLeft;
      styles.bottom = yBottom;
      break;
    case 'bottom-center':
      styles.left = `calc(50% + ${cssDimension(position.offset_x)})`;
      styles.bottom = yBottom;
      styles.transform = 'translateX(-50%)';
      break;
    case 'custom':
      if (position.top !== '') styles.top = cssDimension(position.top);
      if (position.right !== '') styles.right = cssDimension(position.right);
      if (position.bottom !== '') styles.bottom = cssDimension(position.bottom);
      if (position.left !== '') styles.left = cssDimension(position.left);
      break;
    case 'bottom-right':
    default:
      styles.right = xRight;
      styles.bottom = yBottom;
      break;
  }
  return styles;
}
