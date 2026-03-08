"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import styles from "./gallery-experience.module.css";

export interface GalleryExperienceItem {
  id: string;
  type: "photo" | "video";
  url: string;
  caption: string;
  sortOrder?: number;
}

export interface GalleryExperienceAlbum {
  id: string;
  tripSlug: string;
  title: string;
  coverImage: string;
  featured: boolean;
  items: GalleryExperienceItem[];
}

interface GalleryExperienceProps {
  albums: GalleryExperienceAlbum[];
}

interface FlatMediaItem extends GalleryExperienceItem {
  albumId: string;
  albumTitle: string;
  albumCover: string;
}

const FALLBACK_IMAGE = "/logo.png";

function getEmbeddableVideoUrl(input: string) {
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;

      const shortsMatch = url.pathname.match(/\/shorts\/([^/?]+)/i);
      if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }

    if (host.includes("youtu.be")) {
      const id = url.pathname.replace("/", "").trim();
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    if (host.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }

    if (url.pathname.includes("/embed/")) {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function GalleryPhoto({
  src,
  alt,
  fallback,
  className,
  sizes = "(max-width: 680px) 100vw, (max-width: 980px) 50vw, 33vw",
  width = 1200,
  height = 900
}: {
  src: string;
  alt: string;
  fallback: string;
  className?: string;
  sizes?: string;
  width?: number;
  height?: number;
}) {
  const [imageSrc, setImageSrc] = useState(src || fallback || FALLBACK_IMAGE);

  useEffect(() => {
    setImageSrc(src || fallback || FALLBACK_IMAGE);
  }, [src, fallback]);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      sizes={sizes}
      loading="lazy"
      unoptimized
      onError={() => {
        if (imageSrc !== fallback && fallback) {
          setImageSrc(fallback);
          return;
        }
        if (imageSrc !== FALLBACK_IMAGE) {
          setImageSrc(FALLBACK_IMAGE);
        }
      }}
    />
  );
}

export function GalleryExperience({ albums }: GalleryExperienceProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<string>("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sortedAlbums = useMemo(
    () =>
      [...albums].sort((a, b) => {
        if (a.featured === b.featured) return a.title.localeCompare(b.title);
        return a.featured ? -1 : 1;
      }),
    [albums]
  );

  const allMedia = useMemo<FlatMediaItem[]>(
    () =>
      sortedAlbums.flatMap((album) =>
        album.items.map((item) => ({
          ...item,
          albumId: album.id,
          albumTitle: album.title,
          albumCover: album.coverImage
        }))
      ),
    [sortedAlbums]
  );

  const filteredMedia = useMemo(
    () => (selectedAlbum === "all" ? allMedia : allMedia.filter((item) => item.albumId === selectedAlbum)),
    [allMedia, selectedAlbum]
  );

  const activeMedia = activeIndex !== null ? filteredMedia[activeIndex] : null;
  const activeEmbed = activeMedia?.type === "video" ? getEmbeddableVideoUrl(activeMedia.url) : null;

  useEffect(() => {
    if (activeIndex !== null && activeIndex >= filteredMedia.length) {
      setActiveIndex(filteredMedia.length > 0 ? filteredMedia.length - 1 : null);
    }
  }, [activeIndex, filteredMedia.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((prev) => {
          if (prev === null) return null;
          return (prev + 1) % filteredMedia.length;
        });
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((prev) => {
          if (prev === null) return null;
          return (prev - 1 + filteredMedia.length) % filteredMedia.length;
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, filteredMedia.length]);

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.albumFilters}>
          <button
            type="button"
            className={selectedAlbum === "all" ? styles.filterActive : styles.filter}
            onClick={() => setSelectedAlbum("all")}
          >
            Todo
          </button>
          {sortedAlbums.map((album) => (
            <button
              key={album.id}
              type="button"
              className={selectedAlbum === album.id ? styles.filterActive : styles.filter}
              onClick={() => setSelectedAlbum(album.id)}
            >
              {album.title}
            </button>
          ))}
        </div>

        <p className={styles.counter}>
          {filteredMedia.length} {filteredMedia.length === 1 ? "elemento" : "elementos"}
        </p>
      </div>

      {filteredMedia.length > 0 ? (
        <div className={styles.grid}>
          {filteredMedia.map((media, index) => (
            <button
              key={media.id}
              type="button"
              className={styles.tile}
              onClick={() => setActiveIndex(index)}
              aria-label={`Abrir ${media.type === "photo" ? "foto" : "video"}: ${media.caption}`}
            >
              <GalleryPhoto
                src={media.type === "photo" ? media.url : media.albumCover}
                fallback={media.albumCover}
                alt={media.caption}
                className={styles.tileImage}
              />
              <span className={styles.tileType}>{media.type === "photo" ? "Foto" : "Video"}</span>
              <span className={styles.tileCaption}>
                <strong>{media.albumTitle}</strong>
                <small>{media.caption}</small>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <section className={`card ${styles.empty}`}>
          <h3>Esta colección aún no tiene contenido</h3>
          <p className="muted">Pronto añadiremos más fotos y videos de esta experiencia.</p>
        </section>
      )}

      {activeMedia ? (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Visor de galería">
          <button type="button" className={styles.backdrop} onClick={() => setActiveIndex(null)} aria-label="Cerrar visor" />
          <div className={styles.lightboxBody}>
            <button
              type="button"
              className={styles.nav}
              onClick={() =>
                setActiveIndex((prev) => {
                  if (prev === null) return null;
                  return (prev - 1 + filteredMedia.length) % filteredMedia.length;
                })
              }
              aria-label="Anterior"
            >
              ‹
            </button>

            <div className={styles.lightboxMedia}>
              {activeMedia.type === "photo" ? (
                <GalleryPhoto
                  src={activeMedia.url}
                  fallback={activeMedia.albumCover}
                  alt={activeMedia.caption}
                  className={styles.lightboxImage}
                  sizes="(max-width: 980px) 100vw, 80vw"
                  width={1920}
                  height={1280}
                />
              ) : activeEmbed ? (
                <iframe
                  className={styles.lightboxVideo}
                  src={activeEmbed}
                  title={activeMedia.caption}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className={styles.videoFallback}>
                  <p>Este video no permite vista embebida.</p>
                  <a className="button-outline" href={activeMedia.url} target="_blank" rel="noreferrer">
                    Abrir video en otra pestaña
                  </a>
                </div>
              )}

              <div className={styles.lightboxMeta}>
                <p>{activeMedia.albumTitle}</p>
                <h3>{activeMedia.caption}</h3>
              </div>
            </div>

            <button
              type="button"
              className={styles.nav}
              onClick={() =>
                setActiveIndex((prev) => {
                  if (prev === null) return null;
                  return (prev + 1) % filteredMedia.length;
                })
              }
              aria-label="Siguiente"
            >
              ›
            </button>

            <button type="button" className={styles.close} onClick={() => setActiveIndex(null)} aria-label="Cerrar">
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
