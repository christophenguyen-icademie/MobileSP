import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { View, StyleSheet, GestureResponderEvent } from "react-native";

export interface PagerViewRef {
  setPage: (index: number) => void;
}

interface PagerViewProps {
  initialPage?: number;
  onPageSelected?: (index: number) => void;
  style?: any;
  children: React.ReactNode;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  pagesContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
  },
  page: {
    flex: 1,
    minWidth: "100%",
  },
});

export const PagerView = forwardRef<PagerViewRef, PagerViewProps>(
  (
    {
      initialPage = 0,
      onPageSelected,
      style,
      children,
    },
    ref
  ) => {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const containerRef = useRef<View>(null);
    const touchStartX = useRef<number>(0);
    const childrenArray = Array.isArray(children) ? children : [children];

    useImperativeHandle(ref, () => ({
      setPage: (index: number) => {
        setCurrentPage(Math.max(0, Math.min(index, childrenArray.length - 1)));
      },
    }));

    useEffect(() => {
      onPageSelected?.(currentPage);
    }, [currentPage, onPageSelected]);

    const handleTouchStart = (e: GestureResponderEvent) => {
      touchStartX.current = e.nativeEvent.pageX;
    };

    const handleTouchEnd = (e: GestureResponderEvent) => {
      const touchEndX = e.nativeEvent.pageX;
      const diff = touchStartX.current - touchEndX;

      // Si le swipe est significatif (> 30px)
      if (Math.abs(diff) > 30) {
        if (diff > 0 && currentPage < childrenArray.length - 1) {
          // Swipe gauche = page suivante
          setCurrentPage(currentPage + 1);
        } else if (diff < 0 && currentPage > 0) {
          // Swipe droite = page précédente
          setCurrentPage(currentPage - 1);
        }
      }
    };

    return (
      <View
        style={[styles.container, style]}
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <View
          style={[
            styles.pagesContainer,
            {
              transform: [{ translateX: -currentPage * 100 + "%" }],
              transitionDuration: "300ms",
              transitionProperty: "transform",
              transitionTimingFunction: "ease-out",
            } as any,
          ]}
        >
          {childrenArray.map((child, index) => (
            <View key={index} style={styles.page}>
              {child}
            </View>
          ))}
        </View>
      </View>
    );
  }
);

PagerView.displayName = "PagerView";

