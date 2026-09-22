/* ============================================================
   图片灯箱
   用途：点击简历预览图后放大查看。
   设计取向：与站内动效一致——位移/透明度走合成层，prefers-reduced-motion 下退化。

   实现要点（都是踩过坑的地方）：
   - 用原生 <dialog> 的 showModal()：浏览器自带顶层渲染 + 焦点陷阱 + ESC 关闭，
     比自己拿 div 做遮罩省事且无障碍正确。但 Safari 15 以前不支持，故做能力探测后降级。
   - 打开时锁 body 滚动。不能直接写 overflow:hidden——会丢滚动位置导致页面跳顶，
     必须记录 scrollY 再用 position:fixed + top:-Y 的经典补偿法。
   - 缩放用 transform:scale，不改 width——不触发重排。
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';

const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 缩放倍率边界与步进。抽成具名导出方便测试直接断言。 */
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;
export const ZOOM_STEP = 0.5;

export const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

/* 关闭后需要把滚动位置还原，这段逻辑独立出来便于测试 */
export function lockBodyScroll() {
  const y = window.scrollY || 0;
  const { style } = document.body;
  const prev = {
    position: style.position,
    top: style.top,
    width: style.width,
    overflow: style.overflow,
  };
  style.position = 'fixed';
  style.top = `-${y}px`;
  style.width = '100%';
  style.overflow = 'hidden';

  return () => {
    style.position = prev.position;
    style.top = prev.top;
    style.width = prev.width;
    style.overflow = prev.overflow;
    // 还原时先跳回原位置，避免用户看到页面闪到顶部
    window.scrollTo({ top: y, behavior: 'auto' });
  };
}

export function ImageLightbox({ src, srcSet, sizes, alt, caption, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dialogRef = useRef(null);
  const dragRef = useRef(null);

  const reset = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  /* 打开：进 dialog 顶层 + 锁滚动 */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    // showModal 支持时用它（自带焦点陷阱与 ESC）；否则退化为普通显示
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else if (typeof dialog.setAttribute === 'function') {
      dialog.setAttribute('open', '');
    }

    const unlock = lockBodyScroll();
    return () => {
      unlock();
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    };
  }, []);

  /* ESC / 方向键 / 加减号 */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => clampZoom(z + ZOOM_STEP));
      } else if (e.key === '-' || e.key === '_') {
        setZoom((z) => clampZoom(z - ZOOM_STEP));
      } else if (e.key === '0') {
        reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, reset]);

  /* 滚轮缩放：需阻止默认，否则页面会跟着滚 */
  const onWheel = (e) => {
    e.preventDefault();
    const next = clampZoom(zoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
    setZoom(next);
    // 缩回 1 倍时顺手把平移也归零，避免图片停在偏移位置
    if (next === ZOOM_MIN) setOffset({ x: 0, y: 0 });
  };

  /* 放大后可拖拽平移到想看的位置 */
  const onPointerDown = (e) => {
    if (zoom <= ZOOM_MIN) return;
    dragRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    setOffset({
      x: e.clientX - dragRef.current.x,
      y: e.clientY - dragRef.current.y,
    });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onDoubleClick = () => {
    if (zoom > ZOOM_MIN) reset();
    else setZoom(2);
  };

  const onBackdropClick = (e) => {
    // 只有点在遮罩本身（而不是图片或工具栏）才关闭
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label={alt ? `${alt}（放大查看）` : '图片放大查看'}
      onClose={onClose}
      onClick={onBackdropClick}
    >
      <div className="lightbox-toolbar">
        <span className="lightbox-caption">{caption}</span>
        <div className="lightbox-actions">
          <button
            type="button"
            className="lightbox-btn"
            onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
            disabled={zoom <= ZOOM_MIN}
            aria-label="缩小"
          >
            −
          </button>
          <span className="lightbox-zoom" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="lightbox-btn"
            onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
            disabled={zoom >= ZOOM_MAX}
            aria-label="放大"
          >
            +
          </button>
          <button
            type="button"
            className="lightbox-btn lightbox-btn--reset"
            onClick={reset}
            disabled={zoom === ZOOM_MIN && !offset.x && !offset.y}
            aria-label="恢复原始大小"
          >
            重置
          </button>
          <button
            type="button"
            className="lightbox-btn lightbox-btn--close"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      </div>

      <div
        className="lightbox-stage"
        data-zoomable={zoom > ZOOM_MIN}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          draggable="false"
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
            transition: reduced() || dragRef.current
              ? 'none'
              : 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        />
      </div>

      <p className="lightbox-hint">
        滚轮或双击缩放 · 放大后可拖动 · ESC 关闭
      </p>
    </dialog>
  );
}
