import { useEffect, useMemo, useState } from "react";
import type { SceneDefinition } from "../types/scenes";
import { resolveSceneImage } from "../utils/resolveSceneImage";

interface SceneAssetStatus {
  isLoading: boolean;
  loadedCount: number;
  totalCount: number;
}

const loadImage = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed: ${src}`));
    img.src = src;

    if (img.complete && img.naturalWidth > 0) {
      resolve();
    }
  });

export const useSceneAssetsLoading = (scene: SceneDefinition) => {
  const [status, setStatus] = useState<SceneAssetStatus>({
    isLoading: false,
    loadedCount: 0,
    totalCount: 0,
  });

  const sources = useMemo(() => {
    const baseSources = [resolveSceneImage(scene.imageSrc)];
    const objectSources = scene.objects
      .filter((object) => Boolean(object.imageSrc))
      .map((object) => resolveSceneImage(object.imageSrc as string));

    return [...baseSources, ...objectSources];
  }, [scene]);

  useEffect(() => {
    let isActive = true;
    const total = sources.length;

    if (total === 0) {
      setStatus({
        isLoading: false,
        loadedCount: total,
        totalCount: total,
      });
      return;
    }

    setStatus({
      isLoading: true,
      loadedCount: 0,
      totalCount: total,
    });

    let loaded = 0;

    const handleStep = () => {
      loaded += 1;
      if (!isActive) {
        return;
      }
      setStatus((prev) => ({
        ...prev,
        loadedCount: loaded,
      }));
    };

    const promises = sources.map((src) =>
      loadImage(src)
        .catch((error) => {
          console.warn(error);
        })
        .finally(handleStep)
    );

    Promise.all(promises).then(() => {
      if (!isActive) {
        return;
      }
      setStatus({
        isLoading: false,
        loadedCount: total,
        totalCount: total,
      });
    });

    return () => {
      isActive = false;
    };
  }, [scene, sources]);

  return status;
};
