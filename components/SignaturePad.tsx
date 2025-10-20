import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';

interface SignaturePadProps {
  width?: number;
  height?: number;
  onSignatureEnd: (dataUrl: string) => void;
  disabled?: boolean;
}

interface SignaturePadHandle {
  clear: () => void;
}

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ width = 400, height = 150, onSignatureEnd, disabled = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const clearCanvas = useCallback(() => {
        if (disabled) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            onSignatureEnd('');
        }
    }, [disabled, onSignatureEnd]);

    useImperativeHandle(ref, () => ({
      clear: clearCanvas,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const getMousePos = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };

      const startDrawing = (e: MouseEvent | TouchEvent) => {
        if (disabled) return;
        e.preventDefault();
        isDrawing.current = true;
        lastPos.current = getMousePos(e);
      };

      const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing.current || disabled) return;
        e.preventDefault();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const currentPos = getMousePos(e);
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
        lastPos.current = currentPos;
      };
      
      const stopDrawing = () => {
        if (!isDrawing.current || disabled) return;
        isDrawing.current = false;
        if (canvas) {
          onSignatureEnd(canvas.toDataURL('image/png'));
        }
      };

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      ctx.scale(dpr, dpr);
      const style = getComputedStyle(document.body);
      ctx.strokeStyle = style.getPropertyValue('--fg').trim() || '#E8F2EE';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (disabled) {
          canvas.style.cursor = 'not-allowed';
      } else {
          canvas.style.cursor = 'crosshair';
      }

      // Mouse events
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);
      
      // Touch events
      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDrawing);

      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseleave', stopDrawing);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
      };
    }, [width, height, onSignatureEnd, disabled]);

    return (
      <canvas
        id="signature-pad-canvas"
        ref={canvasRef}
        style={{ backgroundColor: 'var(--bg)' }}
        className={`w-full ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'}`}
      />
    );
  }
);

export default SignaturePad;
