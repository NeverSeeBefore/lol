import React from 'react';
import ColorBoard from 'Src/components/ColorBoard';
import styles from './index.module.less';

export default function ColorTransform() {
  return (
    <div className={styles['color-transform']}>
      <ColorBoard />
    </div>
  );
}
