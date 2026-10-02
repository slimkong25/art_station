import {
  useState,
  useEffect,
  useRef,
} from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from "react-router";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import SketchbookPage from "./Sketchbook";
import AdminSketchbooks from "./AdminSketchbooks";

import { supabase } from "./lib/supabaseClient";
import "./App.css";

/* =========================
   HEADER
========================= */

function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">
        KARTHIK
      </Link>

      <nav className="nav">
        <Link to="/shop">SHOP</Link>

        <Link to="/commission">
          COMMISSION
        </Link>

        <Link
          to="/blog"
          className="blog-link"
        >
          BLOG
        </Link>
        <Link to="/sketchbook">
  SKETCHBOOK
</Link>

        <Link to="/playground">
          PLAYGROUND
        </Link>

        <Link to="/about">
          ABOUT ME
        </Link>
      </nav>
    </header>
  );
}


/* =========================
   HOME GALLERY
========================= */

function Gallery() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  useEffect(() => {
    async function fetchArtworks() {
      const { data, error } =
        await supabase
          .from("artworks")
          .select("*")
          .eq("show_on_home", true)
          .order("sort_order", {
            ascending: true,
          });

      if (error) {
        console.error(error);
        setError(error.message);
        setLoading(false);
        return;
      }

      const preparedArtworks =
        (data || []).map((artwork) => {
          const { data: urlData } =
            supabase.storage
              .from("artworks")
              .getPublicUrl(
                artwork.image_path
              );

          return {
            ...artwork,
            image_url:
              urlData.publicUrl,
          };
        });

      setArtworks(preparedArtworks);
      setLoading(false);
    }

    fetchArtworks();
  }, []);

  if (loading) {
    return (
      <div className="gallery-message">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="gallery-message">
        {error}
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="gallery-message">
        No artworks published yet.
      </div>
    );
  }

  const columns = [[], [], []];

  artworks.forEach(
    (artwork, index) => {
      const column =
        artwork.column_position >= 1 &&
        artwork.column_position <= 3
          ? artwork.column_position - 1
          : index % 3;

      columns[column].push(
        artwork
      );
    }
  );

  return (
    <main className="gallery">
      {columns.map(
        (column, columnIndex) => (
          <div
            className="gallery-column"
            key={columnIndex}
          >
            {column.map(
              (artwork) => (
                <img
                  key={artwork.id}
                  src={
                    artwork.image_url
                  }
                  alt={
                    artwork.title ||
                    "Artwork"
                  }
                  className="artwork"
                />
              )
            )}
          </div>
        )
      )}
    </main>
  );
}


/* =========================
   SOCIAL ICONS
========================= */

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="social-icon"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="17.3"
        cy="6.8"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="social-icon"
      aria-hidden="true"
    >
      <path
        d="M12 3.2a8.8 8.8 0 0 0-3.2 17c-.1-1.5 0-2.6.3-3.8l1-4.2s-.5-1-.5-2.2c0-2 1.2-3.5 2.7-3.5 1.3 0 1.9 1 1.9 2.1 0 1.3-.8 3.1-1.2 4.8-.3 1.4.7 2.5 2 2.5 2.4 0 4-2.5 4-6.1 0-3.2-2.3-5.4-5.6-5.4-3.8 0-6.1 2.8-6.1 5.7 0 1.1.4 2.2.9 3 .1.1.1.2 0 .4l-.3 1.2c-.1.4-.4.5-.7.3-1.4-.6-2.3-2.6-2.3-4.2 0-3.4 2.5-8.3 8.6-8.3 4.5 0 8 3.2 8 7.4 0 4.4-2.8 8-6.7 8-1.3 0-2.6-.7-3-1.6l-.8 3.1c-.3 1.2-1.1 2.7-1.6 3.6.8.2 1.7.3 2.6.3A8.8 8.8 0 1 0 12 3.2Z"
        fill="currentColor"
      />
    </svg>
  );
}


/* =========================
   FOOTER
========================= */

function Footer() {
  return (
    <footer className="footer">
      <section className="footer-contact">
        <h2>
          LET'S TALK ABOUT ART.
        </h2>

        <p>
          Have a question, want to
          talk about a piece, or want
          me to make something?
        </p>

        <a
          href="mailto:karthik25ayu@gmail.com"
          className="email-link"
        >
          EMAIL ME ↗
        </a>
      </section>

      <section className="footer-bottom">
        <div className="footer-identity">
          <span>KARTHIK</span>

          <span>
            ARTIST / MAKER / ART ENJOYER
          </span>
        </div>

        <div className="footer-socials">
          <a
            href="https://www.instagram.com/karthik.draws/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <InstagramIcon />
          </a>

          <a
            href="https://www.pinterest.com/artismmmmmmmmm/"
            target="_blank"
            rel="noreferrer"
            aria-label="Pinterest"
          >
            <PinterestIcon />
          </a>
        </div>

        <div className="copyright">
          © 2026 KARTHIK
        </div>
      </section>
    </footer>
  );
}


/* =========================
   HOME
========================= */

function Home() {
  return (
    <>
      <Header />
      <Gallery />
      <Footer />
    </>
  );
}


/* =========================
   PUBLIC BLOG
========================= */

function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } =
        await supabase
          .from("blog_posts")
          .select("*")
          .eq("published", true)
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setPosts(data || []);
      setLoading(false);
    }

    fetchPosts();
  }, []);

  return (
    <>
      <Header />

      <main className="blog-page">

        <div className="blog-page-heading">
          <span>BLOG</span>

          <h1>
            Thoughts, experiments,
            <br />
            and art nonsense.
          </h1>
        </div>

        {loading && (
          <p>Loading...</p>
        )}

        {error && (
          <p className="blog-error">
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          posts.length === 0 && (
            <p className="blog-empty">
              Nothing here yet.
            </p>
          )}

        <div className="blog-list">
          {posts.map((post) => (
            <article
              className="blog-card"
              key={post.id}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="blog-card-title"
              >
                {post.title}
              </Link>

              <div className="blog-card-meta">
                {new Date(
                  post.created_at
                ).toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </div>

              {post.excerpt && (
                <p>
                  {post.excerpt}
                </p>
              )}
            </article>
          ))}
        </div>

      </main>
    </>
  );
}

/* =========================
   SINGLE BLOG POST
========================= */

function BlogPost() {
  const { slug } = useParams();

  const [post, setPost] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function fetchPost() {
      const { data, error } =
        await supabase
          .from("blog_posts")
          .select("*")
          .eq("slug", slug)
          .eq("published", true)
          .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setPost(data);
      setLoading(false);
    }

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <>
        <Header />

        <main className="blog-post-page">
          <p>Loading...</p>
        </main>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Header />

        <main className="blog-post-page">
          <h1>
            This post doesn't exist.
          </h1>

          <Link
            to="/blog"
            className="back-link"
          >
            ← BACK TO BLOG
          </Link>
        </main>
      </>
    );
  }

  const blocks =
    post.content_blocks &&
    post.content_blocks.length > 0
      ? post.content_blocks
      : [
          {
            id: "legacy-content",
            type: "text",
            content: post.content || "",
          },
        ];

  return (
    <>
      <Header />

      <main className="blog-post-page">

        <Link
          to="/blog"
          className="back-link"
        >
          ← BLOG
        </Link>

        <h1 className="blog-post-title">
          {post.title}
        </h1>

        <div className="blog-post-meta">
          {new Date(
            post.created_at
          ).toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }
          )}
        </div>

        {post.excerpt && (
          <p className="blog-post-excerpt">
            {post.excerpt}
          </p>
        )}

        <div className="blog-post-content">

          {blocks.map((block) => {
            if (block.type === "text") {
              return (
                <p
                  key={block.id}
                  className="blog-content-text"
                >
                  {block.content}
                </p>
              );
            }

            if (
              block.type === "image" &&
              block.image_path
            ) {
              const imageUrl =
                supabase.storage
                  .from("blog")
                  .getPublicUrl(
                    block.image_path
                  ).data.publicUrl;

              return (
                <figure
                  key={block.id}
                  className="blog-content-image"
                >
                  <img
                    src={imageUrl}
                    alt={
                      block.caption ||
                      post.title
                    }
                  />

                  {block.caption && (
                    <figcaption>
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );
            }

            return null;
          })}

        </div>

      </main>
    </>
  );
}

/* =========================
   ADMIN LOGIN
========================= */

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleLogin(
    event
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const { error } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate("/admin");
  }

  return (
    <div className="admin-page">
      <div className="admin-login">
        <h1>ADMIN</h1>

        <form
          onSubmit={handleLogin}
        >
          <label>
            EMAIL

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              required
            />
          </label>

          <label>
            PASSWORD

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              required
            />
          </label>

          {error && (
            <p className="admin-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="admin-button"
            disabled={loading}
          >
            {loading
              ? "LOGGING IN..."
              : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
}

function BlogBlocksEditor({ blocks, setBlocks }) {
  function addTextBlock() {
    setBlocks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type: "text",
        content: "",
      },
    ]);
  }

  function addImageBlock() {
    setBlocks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type: "image",
        image_path: "",
        preview: "",
        file: null,
        caption: "",
      },
    ]);
  }

  function updateBlock(id, field, value) {
    setBlocks((current) =>
      current.map((block) =>
        block.id === id
          ? { ...block, [field]: value }
          : block
      )
    );
  }

  function removeBlock(id) {
    setBlocks((current) =>
      current.filter((block) => block.id !== id)
    );
  }

  function moveBlock(id, direction) {
    setBlocks((current) => {
      const index = current.findIndex(
        (block) => block.id === id
      );

      if (index === -1) return current;

      const newIndex =
        direction === "up"
          ? index - 1
          : index + 1;

      if (
        newIndex < 0 ||
        newIndex >= current.length
      ) {
        return current;
      }

      const copy = [...current];

      [copy[index], copy[newIndex]] = [
        copy[newIndex],
        copy[index],
      ];

      return copy;
    });
  }

  function handleImageChange(id, file) {
    if (!file) return;

    const preview = URL.createObjectURL(file);

    setBlocks((current) =>
      current.map((block) =>
        block.id === id
          ? {
              ...block,
              file,
              preview,
            }
          : block
      )
    );
  }

  return (
    <div className="blog-block-editor">

      <div className="blog-block-toolbar">
        <button
          type="button"
          className="block-add-button"
          onClick={addTextBlock}
        >
          + TEXT
        </button>

        <button
          type="button"
          className="block-add-button"
          onClick={addImageBlock}
        >
          + IMAGE
        </button>
      </div>

      {blocks.length === 0 && (
        <div className="blog-block-empty">
          Start your post with a text block or image.
        </div>
      )}

      {blocks.map((block, index) => (
        <div
          className="blog-block"
          key={block.id}
        >
          <div className="blog-block-header">
            <span>
              {block.type === "text"
                ? "TEXT BLOCK"
                : "IMAGE BLOCK"}
            </span>

            <div className="blog-block-controls">
              <button
                type="button"
                onClick={() =>
                  moveBlock(
                    block.id,
                    "up"
                  )
                }
              >
                ↑
              </button>

              <button
                type="button"
                onClick={() =>
                  moveBlock(
                    block.id,
                    "down"
                  )
                }
              >
                ↓
              </button>

              <button
                type="button"
                className="block-remove"
                onClick={() =>
                  removeBlock(block.id)
                }
              >
                REMOVE
              </button>
            </div>
          </div>

          {block.type === "text" && (
            <textarea
              className="blog-block-text"
              rows="7"
              value={block.content}
              onChange={(event) =>
                updateBlock(
                  block.id,
                  "content",
                  event.target.value
                )
              }
              placeholder="Write this part of the story..."
            />
          )}

          {block.type === "image" && (
            <div className="blog-image-block">

              {block.type === "image" && (
  <div className="blog-image-block">

    <input
      type="file"
      accept="image/*"
      onChange={(event) =>
        handleImageChange(
          block.id,
          event.target.files?.[0] || null
        )
      }
    />

    <input
      type="text"
      placeholder="Image caption (optional)"
      value={block.caption || ""}
      onChange={(event) =>
        updateBlock(
          block.id,
          {
            caption: event.target.value
          }
        )
      }
    />

  </div>
)}

              {block.preview && (
                <img
                  src={block.preview}
                  alt=""
                  className="blog-image-preview"
                />
              )}

              {!block.preview &&
                block.image_path && (
                  <img
                    src={supabase.storage
                      .from("blog")
                      .getPublicUrl(
                        block.image_path
                      ).data.publicUrl}
                    alt=""
                    className="blog-image-preview"
                  />
                )}

              <input
                type="text"
                value={
                  block.caption || ""
                }
                onChange={(event) =>
                  updateBlock(
                    block.id,
                    "caption",
                    event.target.value
                  )
                }
                placeholder="Caption (optional)"
              />

            </div>
          )}

        </div>
      ))}
    </div>
  );
}

async function prepareImageForUpload(file) {
  if (!file) return null;

  const maxSize = 2000;

  const image = new Image();

  const objectUrl = URL.createObjectURL(file);

  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = objectUrl;
    });

    const scale = Math.min(
      1,
      maxSize / Math.max(
        image.width,
        image.height
      )
    );

    const canvas = document.createElement("canvas");

    canvas.width = Math.round(
      image.width * scale
    );

    canvas.height = Math.round(
      image.height * scale
    );

    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const blob = await new Promise((resolve) => {
      canvas.toBlob(
        resolve,
        "image/jpeg",
        0.88
      );
    });

    if (!blob) {
      throw new Error(
        "Could not prepare image."
      );
    }

    return new File(
      [blob],
      file.name.replace(
        /\.[^/.]+$/,
        ".jpg"
      ),
      {
        type: "image/jpeg",
      }
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function AdminLayout({
  artworks,
  fetchArtworks,
  setError,
  setSuccess,
}) {
  const [activeLayout, setActiveLayout] =
    useState("home");

  const [homeColumns, setHomeColumns] =
    useState([[], [], []]);

  const [shopItems, setShopItems] =
    useState([]);

  const [activeId, setActiveId] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    })
  );


  /* =========================
     BUILD LAYOUT
  ========================= */

  useEffect(() => {
    const columns = [[], [], []];

    const homeArtworks = artworks
      .filter(
        (artwork) =>
          artwork.show_on_home
      )
      .sort((a, b) => {
        const columnA =
          Number(a.column_position) || 1;

        const columnB =
          Number(b.column_position) || 1;

        if (columnA !== columnB) {
          return columnA - columnB;
        }

        return (
          (Number(a.sort_order) || 0) -
          (Number(b.sort_order) || 0)
        );
      });

    homeArtworks.forEach((artwork) => {
      const column =
        Math.min(
          3,
          Math.max(
            1,
            Number(
              artwork.column_position
            ) || 1
          )
        ) - 1;

      columns[column].push(artwork);
    });

    setHomeColumns(columns);


    const shop = artworks
      .filter(
        (artwork) =>
          artwork.show_in_shop
      )
      .sort((a, b) => {
        const orderA =
          Number(a.shop_order) || 999999;

        const orderB =
          Number(b.shop_order) || 999999;

        return orderA - orderB;
      });

    setShopItems(shop);
  }, [artworks]);


  /* =========================
     FIND ARTWORK
  ========================= */

  function findArtwork(id) {
    for (
      let columnIndex = 0;
      columnIndex < homeColumns.length;
      columnIndex++
    ) {
      const artwork =
        homeColumns[columnIndex].find(
          (item) => item.id === id
        );

      if (artwork) {
        return artwork;
      }
    }

    return shopItems.find(
      (item) => item.id === id
    );
  }


  /* =========================
     DRAG START
  ========================= */

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }


  /* =========================
     DRAG CANCEL
  ========================= */

  function handleDragCancel() {
    setActiveId(null);
  }


  /* =========================
     HOME DRAG END
  ========================= */

  function handleHomeDragEnd(event) {
    const {
      active,
      over,
    } = event;

    setActiveId(null);

    if (!over) {
      return;
    }

    if (active.id === over.id) {
      return;
    }

    setHomeColumns((current) => {
      const next = current.map(
        (column) => [...column]
      );

      let sourceColumn = -1;
      let sourceIndex = -1;

      let targetColumn = -1;
      let targetIndex = -1;

      next.forEach(
        (column, columnIndex) => {
          const source =
            column.findIndex(
              (item) =>
                item.id === active.id
            );

          if (source !== -1) {
            sourceColumn =
              columnIndex;

            sourceIndex = source;
          }

          const target =
            column.findIndex(
              (item) =>
                item.id === over.id
            );

          if (target !== -1) {
            targetColumn =
              columnIndex;

            targetIndex = target;
          }
        }
      );

      if (
        sourceColumn === -1 ||
        targetColumn === -1
      ) {
        return current;
      }

      const [moved] =
        next[sourceColumn].splice(
          sourceIndex,
          1
        );

      if (
        sourceColumn === targetColumn
      ) {
        next[targetColumn] =
          arrayMove(
            [
              ...next[targetColumn],
              moved,
            ],
            next[targetColumn].length,
            targetIndex
          );
      } else {
        next[targetColumn].splice(
          targetIndex,
          0,
          moved
        );
      }

      return next;
    });
  }


  /* =========================
     SHOP DRAG END
  ========================= */

  function handleShopDragEnd(event) {
    const {
      active,
      over,
    } = event;

    setActiveId(null);

    if (!over) {
      return;
    }

    if (active.id === over.id) {
      return;
    }

    setShopItems((current) => {
      const oldIndex =
        current.findIndex(
          (item) =>
            item.id === active.id
        );

      const newIndex =
        current.findIndex(
          (item) =>
            item.id === over.id
        );

      if (
        oldIndex === -1 ||
        newIndex === -1
      ) {
        return current;
      }

      return arrayMove(
        current,
        oldIndex,
        newIndex
      );
    });
  }


  /* =========================
     SAVE HOME
  ========================= */

  async function saveHomeLayout() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      for (
        let columnIndex = 0;
        columnIndex < 3;
        columnIndex++
      ) {
        const column =
          homeColumns[columnIndex];

        for (
          let index = 0;
          index < column.length;
          index++
        ) {
          const artwork =
            column[index];

          const {
            error,
          } = await supabase
            .from("artworks")
            .update({
              column_position:
                columnIndex + 1,

              sort_order:
                index + 1,
            })
            .eq(
              "id",
              artwork.id
            );

          if (error) {
            throw error;
          }
        }
      }

      await fetchArtworks();

      setSuccess(
        "Home layout saved."
      );
    } catch (error) {
      console.error(
        "HOME LAYOUT ERROR:",
        error
      );

      setError(
        error?.message ||
          "Could not save Home layout."
      );
    } finally {
      setSaving(false);
    }
  }


  /* =========================
     SAVE SHOP
  ========================= */

  async function saveShopLayout() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      for (
        let index = 0;
        index < shopItems.length;
        index++
      ) {
        const artwork =
          shopItems[index];

        const {
          error,
        } = await supabase
          .from("artworks")
          .update({
            shop_order:
              index + 1,
          })
          .eq(
            "id",
            artwork.id
          );

        if (error) {
          throw error;
        }
      }

      await fetchArtworks();

      setSuccess(
        "Shop layout saved."
      );
    } catch (error) {
      console.error(
        "SHOP LAYOUT ERROR:",
        error
      );

      setError(
        error?.message ||
          "Could not save Shop layout."
      );
    } finally {
      setSaving(false);
    }
  }


  /* =========================
     SORTABLE CARD
  ========================= */

  function SortableArtwork({
    artwork,
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: artwork.id,
    });

    const style = {
      transform:
        CSS.Transform.toString(
          transform
        ),
      transition,
      opacity: isDragging
        ? 0.25
        : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="layout-card"
      >
        <div className="layout-card-image">
          <img
            src={artwork.image_url}
            alt={
              artwork.title ||
              "Artwork"
            }
            draggable="false"
          />
        </div>

        <div className="layout-card-info">
          <strong>
            {artwork.title ||
              "Untitled"}
          </strong>
        </div>
      </div>
    );
  }


  /* =========================
     DROP ZONE
  ========================= */

  function LayoutColumn({
    column,
    columnIndex,
  }) {
    return (
      <div className="layout-column">

        <div className="layout-column-header">
          <span>
            COLUMN{" "}
            {columnIndex + 1}
          </span>

          <small>
            {column.length} ITEMS
          </small>
        </div>


        <div className="layout-column-body">

          <SortableContext
            items={column.map(
              (item) => item.id
            )}
            strategy={
              verticalListSortingStrategy
            }
          >

            {column.map(
              (artwork) => (
                <SortableArtwork
                  key={artwork.id}
                  artwork={artwork}
                />
              )
            )}

          </SortableContext>


          {column.length === 0 && (
            <div className="layout-empty-column">
              DROP ARTWORK HERE
            </div>
          )}

        </div>

      </div>
    );
  }


  /* =========================
     ACTIVE ARTWORK
  ========================= */

  const activeArtwork =
    activeId
      ? findArtwork(activeId)
      : null;


  /* =========================
     RENDER
  ========================= */

  return (
    <section className="admin-layout">

      <div className="layout-heading">

        <div>
          <p className="admin-kicker">
            VISUAL EDITOR
          </p>

          <h2>LAYOUT</h2>

          <p className="layout-description">
            Drag artworks to arrange
            your pages.
          </p>
        </div>


        <div className="layout-switcher">

          <button
            type="button"
            className={
              activeLayout === "home"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveLayout("home")
            }
          >
            HOME
          </button>

          <button
            type="button"
            className={
              activeLayout === "shop"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveLayout("shop")
            }
          >
            SHOP
          </button>

        </div>

      </div>


      {/* HOME */}

      {activeLayout === "home" && (
        <DndContext
          sensors={sensors}
          collisionDetection={
            closestCenter
          }
          onDragStart={
            handleDragStart
          }
          onDragEnd={
            handleHomeDragEnd
          }
          onDragCancel={
            handleDragCancel
          }
        >

          <div className="home-layout-grid">

            {homeColumns.map(
              (
                column,
                index
              ) => (
                <LayoutColumn
                  key={index}
                  column={column}
                  columnIndex={index}
                />
              )
            )}

          </div>


          <DragOverlay>
            {activeArtwork ? (
              <div className="layout-card layout-card-overlay">

                <div className="layout-card-image">
                  <img
                    src={
                      activeArtwork.image_url
                    }
                    alt={
                      activeArtwork.title ||
                      "Artwork"
                    }
                  />
                </div>

                <div className="layout-card-info">
                  <strong>
                    {activeArtwork.title ||
                      "Untitled"}
                  </strong>
                </div>

              </div>
            ) : null}
          </DragOverlay>


          <div className="layout-actions">

            <span>
              HOME LAYOUT
            </span>

            <button
              type="button"
              className="admin-button"
              onClick={
                saveHomeLayout
              }
              disabled={saving}
            >
              {saving
                ? "SAVING..."
                : "SAVE HOME LAYOUT"}
            </button>

          </div>

        </DndContext>
      )}


      {/* SHOP */}

      {activeLayout === "shop" && (
        <DndContext
          sensors={sensors}
          collisionDetection={
            closestCenter
          }
          onDragStart={
            handleDragStart
          }
          onDragEnd={
            handleShopDragEnd
          }
          onDragCancel={
            handleDragCancel
          }
        >

          <div className="shop-layout-editor">

            <SortableContext
              items={shopItems.map(
                (item) => item.id
              )}
              strategy={
                verticalListSortingStrategy
              }
            >

              {shopItems.map(
                (artwork) => (
                  <SortableArtwork
                    key={artwork.id}
                    artwork={artwork}
                  />
                )
              )}

            </SortableContext>

            {shopItems.length === 0 && (
              <div className="layout-empty-column">
                NO SHOP ARTWORKS
              </div>
            )}

          </div>


          <DragOverlay>
            {activeArtwork ? (
              <div className="layout-card layout-card-overlay">

                <div className="layout-card-image">
                  <img
                    src={
                      activeArtwork.image_url
                    }
                    alt={
                      activeArtwork.title ||
                      "Artwork"
                    }
                  />
                </div>

                <div className="layout-card-info">
                  <strong>
                    {activeArtwork.title ||
                      "Untitled"}
                  </strong>
                </div>

              </div>
            ) : null}
          </DragOverlay>


          <div className="layout-actions">

            <span>
              SHOP LAYOUT
            </span>

            <button
              type="button"
              className="admin-button"
              onClick={
                saveShopLayout
              }
              disabled={saving}
            >
              {saving
                ? "SAVING..."
                : "SAVE SHOP LAYOUT"}
            </button>

          </div>

        </DndContext>
      )}

    </section>
  );
}

/* =========================
   ADMIN DASHBOARD
========================= */

function AdminDashboard() {
  const navigate = useNavigate();

  const [session, setSession] =
    useState(null);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [activeTab, setActiveTab] =
    useState("artworks");

  /* ARTWORKS */

  const [artworks, setArtworks] =
    useState([]);

  const [loadingArtworks, setLoadingArtworks] =
    useState(true);

  /* BLOG */

  const [blogPosts, setBlogPosts] =
    useState([]);

  const [loadingBlogPosts, setLoadingBlogPosts] =
    useState(false);

  const [editingBlogPost, setEditingBlogPost] =
    useState(null);

  /* GENERAL */

  const [uploading, setUploading] =
    useState(false);

  const [savingEdit, setSavingEdit] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [editingArtwork, setEditingArtwork] =
    useState(null);

  /* ARTWORK FORM */

  const [form, setForm] =
  useState({
    title: "",
    medium: "",
    year: new Date().getFullYear(),
    description: "",
    price: "",
    available: false,
    showOnHome: true,
    showInShop: false,
    columnPosition: 1,
    sortOrder: 1,
    palette: [],
  });

  /* BLOG FORM */

  const [blogForm, setBlogForm] =
    useState({
      title: "",
      excerpt: "",
      content: "",
      published: false,
    });
    const [blogBlocks, setBlogBlocks] = useState([]);


  /* ---------- AUTH ---------- */

  useEffect(() => {
    let mounted = true;

    async function getCurrentSession() {
      const { data } =
        await supabase.auth.getSession();

      if (!mounted) return;

      setSession(data.session);
      setCheckingAuth(false);

      if (!data.session) {
        navigate("/admin/login");
      }
    }

    getCurrentSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, currentSession) => {
          if (!mounted) return;

          setSession(
            currentSession
          );

          if (!currentSession) {
            navigate(
              "/admin/login"
            );
          }
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);


  /* ---------- FETCH ARTWORKS ---------- */

  async function fetchArtworks() {
    setLoadingArtworks(true);

    const { data, error } =
      await supabase
        .from("artworks")
        .select("*")
        .order("sort_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      setError(error.message);
      setLoadingArtworks(false);
      return;
    }

    const prepared =
      (data || []).map(
        (artwork) => {
          const { data: urlData } =
            supabase.storage
              .from("artworks")
              .getPublicUrl(
                artwork.image_path
              );

          return {
            ...artwork,
            image_url:
              urlData.publicUrl,
          };
        }
      );

    setArtworks(prepared);
    setLoadingArtworks(false);
  }


  /* ---------- FETCH BLOG ---------- */

  async function fetchBlogPosts() {
    setLoadingBlogPosts(true);

    const { data, error } =
      await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      setError(error.message);
      setLoadingBlogPosts(false);
      return;
    }

    setBlogPosts(data || []);
    setLoadingBlogPosts(false);
  }


  /* ---------- INITIAL LOAD ---------- */

  useEffect(() => {
    if (session) {
      fetchArtworks();
      fetchBlogPosts();
    }
  }, [session]);


  /* ---------- FORM HELPERS ---------- */

  function updateForm(
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateBlogForm(
    field,
    value
  ) {
    setBlogForm((current) => ({
      ...current,
      [field]: value,
    }));
  }


  /* ---------- RESET ARTWORK ---------- */

  function resetForm() {
  setForm({
    title: "",
    medium: "",
    year: new Date().getFullYear(),
    description: "",
    price: "",
    available: false,
    showOnHome: true,
    showInShop: false,
    columnPosition: 1,
    sortOrder: artworks.length + 1,
    palette: [],
  });

  setSelectedFile(null);

  const fileInput =
    document.getElementById("artwork-file");

  if (fileInput) {
    fileInput.value = "";
  }
}

  /* ---------- RESET BLOG ---------- */

  function resetBlogForm() {
  setBlogForm({
    title: "",
    excerpt: "",
    content: "",
    published: false,
  });

  setBlogBlocks([]);

  setEditingBlogPost(null);
}


  /* ---------- ARTWORK UPLOAD ---------- */
async function handleUpload(event) {
  event.preventDefault();

  setUploading(true);
  setError("");
  setSuccess("");

  if (!selectedFile) {
    setError("Choose an image first.");
    setUploading(false);
    return;
  }

  try {
    const preparedFile =
      await prepareImageForUpload(selectedFile);

    const safeFileName =
      preparedFile.name
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, "-");

    const uniqueId =
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`;

    const filePath =
      `${uniqueId}-${safeFileName}`;

    const { error: uploadError } =
      await supabase.storage
        .from("artworks")
        .upload(
          filePath,
          preparedFile,
          {
            upsert: false,
            contentType: "image/jpeg",
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    const orderNumber =
      Number(form.sortOrder);

    const columnPosition =
      ((orderNumber - 1) % 3) + 1;

    const columnOrder =
      Math.floor(
        (orderNumber - 1) / 3
      ) + 1;

    const { error: insertError } =
      await supabase
        .from("artworks")
        .insert({
          title: form.title,
          medium: form.medium,

          year:
            form.year === ""
              ? null
              : Number(form.year),

          description: form.description,

          image_path: filePath,
          image_url: null,

          price:
            form.price === ""
              ? null
              : Number(form.price),

          available: form.available,

          show_on_home:
            form.showOnHome,

          show_in_shop:
            form.showInShop,

          column_position:
            columnPosition,

          sort_order:
            columnOrder,

          // SAVE PALETTE
          palette:
            form.palette || [],
        });

    if (insertError) {
      await supabase.storage
        .from("artworks")
        .remove([filePath]);

      throw insertError;
    }

    setSuccess(
      "Artwork uploaded successfully."
    );

    resetForm();

    await fetchArtworks();

  } catch (error) {
    console.error(
      "UPLOAD ERROR:",
      error
    );
console.error("UPLOAD ERROR:", error);
    setError(
  error?.message ||
  "Upload failed. Check browser console."
);

  } finally {
    setUploading(false);
  }
}

  /* ---------- EDIT ARTWORK ---------- */

function startEditing(artwork) {
  setEditingArtwork(artwork);

  setForm({
    title:
      artwork.title || "",

    medium:
      artwork.medium || "",

    year:
      artwork.year ||
      new Date().getFullYear(),

    description:
      artwork.description || "",

    price:
      artwork.price ?? "",

    available:
      artwork.available || false,

    showOnHome:
      artwork.show_on_home || false,

    showInShop:
      artwork.show_in_shop || false,

    columnPosition:
      artwork.column_position || 1,

    sortOrder:
      artwork.sort_order || 1,

    // LOAD EXISTING PALETTE
    palette:
      Array.isArray(artwork.palette)
        ? artwork.palette
        : [],
  });

  setSelectedFile(null);

  const fileInput =
    document.getElementById(
      "artwork-file"
    );

  if (fileInput) {
    fileInput.value = "";
  }

  setActiveTab("artworks");

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

  /* ---------- SAVE ARTWORK EDIT ---------- */
async function handleEdit(event) {
  event.preventDefault();

  if (!editingArtwork) {
    return;
  }

  setSavingEdit(true);
  setError("");
  setSuccess("");

  let currentImagePath =
    editingArtwork.image_path;

  try {
    if (selectedFile) {
      const preparedFile =
        await prepareImageForUpload(
          selectedFile
        );

      const safeFileName =
        preparedFile.name
          .toLowerCase()
          .replace(
            /[^a-z0-9.-]/g,
            "-"
          );

      const uniqueId =
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 10)}`;

      const newFilePath =
        `${uniqueId}-${safeFileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("artworks")
          .upload(
            newFilePath,
            preparedFile,
            {
              upsert: false,
              contentType: "image/jpeg",
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      currentImagePath =
        newFilePath;
    }

    const { error: updateError } =
      await supabase
        .from("artworks")
        .update({
          title: form.title,
          medium: form.medium,

          year:
            form.year === ""
              ? null
              : Number(form.year),

          description:
            form.description,

          price:
            form.price === ""
              ? null
              : Number(form.price),

          available:
            form.available,

          show_on_home:
            form.showOnHome,

          show_in_shop:
            form.showInShop,

          column_position:
            Number(form.columnPosition),

          sort_order:
            Number(form.sortOrder),

          image_path:
            currentImagePath,

          // SAVE UPDATED PALETTE
          palette:
            form.palette || [],

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          editingArtwork.id
        );

    if (updateError) {
      if (
        currentImagePath !==
        editingArtwork.image_path
      ) {
        await supabase.storage
          .from("artworks")
          .remove([
            currentImagePath,
          ]);
      }

      throw updateError;
    }

    if (
      currentImagePath !==
      editingArtwork.image_path
    ) {
      await supabase.storage
        .from("artworks")
        .remove([
          editingArtwork.image_path,
        ]);
    }

    setSuccess(
      "Artwork updated successfully."
    );

    setEditingArtwork(null);

    resetForm();

    await fetchArtworks();

  } catch (error) {
    console.error(
      "EDIT ERROR:",
      error
    );

    setError(
      error?.message ||
      "Update failed."
    );

  } finally {
    setSavingEdit(false);
  }
}

  /* ---------- CANCEL ARTWORK EDIT ---------- */

  function cancelEdit() {
    setEditingArtwork(null);
    resetForm();

    setError("");
    setSuccess("");
  }


  /* ---------- ARTWORK TOGGLES ---------- */

  async function updateArtwork(
    id,
    field,
    value
  ) {
    setError("");
    setSuccess("");

    const {
      error,
    } = await supabase
      .from("artworks")
      .update({
        [field]: value,
      })
      .eq("id", id);

    if (error) {
      setError(
        error.message
      );
      return;
    }

    setArtworks(
      (current) =>
        current.map(
          (artwork) =>
            artwork.id === id
              ? {
                  ...artwork,
                  [field]:
                    value,
                }
              : artwork
        )
    );
  }


  /* --------- move artwork ------- */
  /* ---------- SAVE HOME LAYOUT ---------- */

async function saveHomeLayout(homeColumns) {
  setError("");
  setSuccess("");

  try {
    const updates = [];

    homeColumns.forEach(
      (column, columnIndex) => {
        column.forEach(
          (artwork, artworkIndex) => {
            updates.push({
              id: artwork.id,

              column_position:
                columnIndex + 1,

              sort_order:
                artworkIndex + 1,
            });
          }
        );
      }
    );

    for (const update of updates) {
      const { error } =
        await supabase
          .from("artworks")
          .update({
            column_position:
              update.column_position,

            sort_order:
              update.sort_order,
          })
          .eq("id", update.id);

      if (error) {
        throw error;
      }
    }

    // Update local admin state too
    setArtworks((current) =>
      current.map((artwork) => {
        const updatedArtwork =
          updates.find(
            (item) =>
              item.id === artwork.id
          );

        if (!updatedArtwork) {
          return artwork;
        }

        return {
          ...artwork,

          column_position:
            updatedArtwork.column_position,

          sort_order:
            updatedArtwork.sort_order,
        };
      })
    );

    setSuccess(
      "Home layout saved."
    );
  } catch (error) {
    console.error(
      "HOME LAYOUT ERROR:",
      error
    );

    setError(
      error?.message ||
      "Could not save Home layout."
    );
  }
}


/* ---------- SAVE SHOP LAYOUT ---------- */

async function saveShopLayout(shopItems) {
  setError("");
  setSuccess("");

  try {
    const updates =
      shopItems.map(
        (artwork, index) => ({
          id: artwork.id,
          shop_order: index + 1,
        })
      );

    for (const update of updates) {
      const { error } =
        await supabase
          .from("artworks")
          .update({
            shop_order:
              update.shop_order,
          })
          .eq("id", update.id);

      if (error) {
        throw error;
      }
    }

    // Update local admin state too
    setArtworks((current) =>
      current.map((artwork) => {
        const updatedArtwork =
          updates.find(
            (item) =>
              item.id === artwork.id
          );

        if (!updatedArtwork) {
          return artwork;
        }

        return {
          ...artwork,

          shop_order:
            updatedArtwork.shop_order,
        };
      })
    );

    setSuccess(
      "Shop layout saved."
    );
  } catch (error) {
    console.error(
      "SHOP LAYOUT ERROR:",
      error
    );

    setError(
      error?.message ||
      "Could not save Shop layout."
    );
  }
}

  /* ---------- DELETE ARTWORK ---------- */

  async function deleteArtwork(
    artwork
  ) {
    const confirmed =
      window.confirm(
        `Delete "${artwork.title || "this artwork"}"?`
      );

    if (!confirmed)
      return;

    setError("");
    setSuccess("");

    const {
      error: storageError,
    } =
      await supabase.storage
        .from("artworks")
        .remove([
          artwork.image_path,
        ]);

    if (storageError) {
      setError(
        storageError.message
      );
      return;
    }

    const {
      error: databaseError,
    } =
      await supabase
        .from("artworks")
        .delete()
        .eq("id", artwork.id);

    if (databaseError) {
      setError(
        databaseError.message
      );
      return;
    }

    setArtworks(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            artwork.id
        )
    );

    setSuccess(
      "Artwork deleted."
    );
  }


  /* ---------- BLOG SLUG ---------- */

  function createSlug(
    title
  ) {
    return title
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        "");
  }


  /* ---------- SAVE BLOG ---------- */

  async function saveBlogPost(event) {
  event.preventDefault();

  setError("");
  setSuccess("");

  const title =
    blogForm.title.trim();

  if (!title) {
    setError(
      "Blog title is required."
    );
    return;
  }

  if (blogBlocks.length === 0) {
    setError(
      "Add at least one content block."
    );
    return;
  }

  try {
    const finalBlocks = [];

    for (const block of blogBlocks) {
      if (block.type === "text") {
        if (!block.content.trim()) {
          continue;
        }

        finalBlocks.push({
          id: block.id,
          type: "text",
          content: block.content,
        });
      }

      if (block.type === "image") {
        let imagePath =
          block.image_path;

        if (block.file) {
          const safeFileName =
            block.file.name
              .toLowerCase()
              .replace(
                /[^a-z0-9.-]/g,
                "-"
              );

          const newPath =
            `blog/${crypto.randomUUID()}-${safeFileName}`;

          const {
            error: uploadError,
          } =
            await supabase.storage
              .from("blog")
              .upload(
                newPath,
                block.file,
                {
                  upsert: false,
                }
              );

          if (uploadError) {
            throw uploadError;
          }

          imagePath = newPath;
        }

        if (!imagePath) {
          continue;
        }

        finalBlocks.push({
          id: block.id,
          type: "image",
          image_path: imagePath,
          caption:
            block.caption || "",
        });
      }
    }

    if (finalBlocks.length === 0) {
      setError(
        "Your post has no usable content."
      );
      return;
    }

    const plainText = finalBlocks
      .filter(
        (block) =>
          block.type === "text"
      )
      .map(
        (block) =>
          block.content
      )
      .join("\n\n");

    const slug =
      createSlug(title);

    if (editingBlogPost) {
      const {
        error,
      } = await supabase
        .from("blog_posts")
        .update({
          title,
          slug,
          excerpt:
            blogForm.excerpt,
          content:
            plainText,
          content_blocks:
            finalBlocks,
          published:
            blogForm.published,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          editingBlogPost.id
        );

      if (error) {
        throw error;
      }

      setSuccess(
        "Blog post updated."
      );
    } else {
      const {
        error,
      } = await supabase
        .from("blog_posts")
        .insert({
          title,
          slug,
          excerpt:
            blogForm.excerpt,
          content:
            plainText,
          content_blocks:
            finalBlocks,
          published:
            blogForm.published,
        });

      if (error) {
        throw error;
      }

      setSuccess(
        blogForm.published
          ? "Blog post published."
          : "Blog post saved as draft."
      );
    }

    resetBlogForm();
    await fetchBlogPosts();

  } catch (error) {
    console.error(error);

    setError(
      error.message ||
        "Could not save blog post."
    );
  }
}

  /* ---------- EDIT BLOG ---------- */

 function startBlogEditing(post) {
  setEditingBlogPost(post);

  setBlogForm({
    title: post.title || "",
    excerpt: post.excerpt || "",
    content: post.content || "",
    published: post.published || false,
  });

  const existingBlocks =
    post.content_blocks &&
    post.content_blocks.length > 0
      ? post.content_blocks
      : post.content
      ? [
          {
            id: crypto.randomUUID(),
            type: "text",
            content: post.content,
          },
        ]
      : [];

  setBlogBlocks(
    existingBlocks.map((block) => ({
      ...block,
      id:
        block.id ||
        crypto.randomUUID(),
      file: null,
      preview: "",
    }))
  );

  setActiveTab("blog");

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}


  /* ---------- DELETE BLOG ---------- */

  async function deleteBlogPost(
    post
  ) {
    const confirmed =
      window.confirm(
        `Delete "${post.title}"?`
      );

    if (!confirmed)
      return;

    setError("");
    setSuccess("");

    const {
      error,
    } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", post.id);

    if (error) {
      setError(
        error.message
      );
      return;
    }

    setBlogPosts(
      (current) =>
        current.filter(
          (item) =>
            item.id !== post.id
        )
    );

    setSuccess(
      "Blog post deleted."
    );
  }


  /* ---------- BLOG PUBLISH TOGGLE ---------- */

  async function toggleBlogPublish(
    post
  ) {
    const {
      error,
    } = await supabase
      .from("blog_posts")
      .update({
        published:
          !post.published,
      })
      .eq("id", post.id);

    if (error) {
      setError(
        error.message
      );
      return;
    }

    setBlogPosts(
      (current) =>
        current.map(
          (item) =>
            item.id === post.id
              ? {
                  ...item,
                  published:
                    !item.published,
                }
              : item
        )
    );
  }


  /* ---------- LOGOUT ---------- */

  async function handleLogout() {
    await supabase.auth.signOut();

    navigate(
      "/admin/login"
    );
  }


  /* ---------- LOADING ---------- */

  if (checkingAuth) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          CHECKING LOGIN...
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }


  /* =========================
     ADMIN UI
  ========================= */

  return (
    <div className="admin-page">
      <div className="admin-dashboard">

        <div className="admin-header">
          <div>
            <p className="admin-kicker">
              KARTHIK ART
            </p>

            <h1>ADMIN</h1>
          </div>

          <button
            className="admin-logout"
            onClick={
              handleLogout
            }
          >
            LOG OUT
          </button>
        </div>


        {/* TABS */}

{/* TABS */}

<div className="admin-tabs">

  <button
    type="button"
    className={`admin-tab ${
      activeTab === "artworks"
        ? "active"
        : ""
    }`}
    onClick={() =>
      setActiveTab("artworks")
    }
  >
    ARTWORKS
  </button>


  <button
    type="button"
    className={`admin-tab ${
      activeTab === "blog"
        ? "active"
        : ""
    }`}
    onClick={() =>
      setActiveTab("blog")
    }
  >
    BLOG
  </button>


  <button
    type="button"
    className={`admin-tab ${
      activeTab === "sketchbook"
        ? "active"
        : ""
    }`}
    onClick={() =>
      setActiveTab("sketchbook")
    }
  >
    SKETCHBOOK
  </button>


  <button
    type="button"
    className={`admin-tab ${
      activeTab === "layout"
        ? "active"
        : ""
    }`}
    onClick={() =>
      setActiveTab("layout")
    }
  >
    LAYOUT
  </button>

</div>


        {/* MESSAGES */}

        {error && (
          <div className="admin-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="admin-message success">
            {success}
          </div>
        )}


        {/* =========================
            ARTWORK TAB
        ========================= */}

        {activeTab ===
          "artworks" && (
          <>
            <section className="admin-upload">

              <div className="admin-form-heading">
                <div>
                  <h2>
                    {editingArtwork
                      ? "EDIT ARTWORK"
                      : "ADD ARTWORK"}
                  </h2>

                  {editingArtwork && (
                    <p>
                      Editing:{" "}
                      <strong>
                        {editingArtwork.title ||
                          "Untitled"}
                      </strong>
                    </p>
                  )}
                </div>

                {editingArtwork && (
                  <button
                    type="button"
                    className="admin-cancel"
                    onClick={
                      cancelEdit
                    }
                  >
                    CANCEL EDIT
                  </button>
                )}
              </div>

              <form
  onSubmit={
    editingArtwork
      ? handleEdit
      : handleUpload
  }
>
  {/* IMAGE */}

  <label className="file-upload">
    <span>IMAGE</span>

    <input
      id="artwork-file"
      type="file"
      accept="image/*"
      onChange={(event) =>
        setSelectedFile(
          event.target.files?.[0] || null
        )
      }
      required={!editingArtwork}
    />

    {selectedFile && (
      <strong>
        {selectedFile.name}
      </strong>
    )}

    {editingArtwork &&
      !selectedFile && (
        <small>
          Current image remains unchanged.
        </small>
      )}
  </label>


  {/* BASIC INFO */}

  <div className="admin-form-grid">

    <label>
      TITLE

      <input
        type="text"
        value={form.title}
        onChange={(event) =>
          updateForm(
            "title",
            event.target.value
          )
        }
      />
    </label>


    <label>
      MEDIUM

      <input
        type="text"
        value={form.medium}
        onChange={(event) =>
          updateForm(
            "medium",
            event.target.value
          )
        }
      />
    </label>


    <label>
      YEAR

      <input
        type="number"
        value={form.year}
        onChange={(event) =>
          updateForm(
            "year",
            event.target.value
          )
        }
      />
    </label>


    <label>
      PRICE

      <input
        type="number"
        min="0"
        value={form.price}
        onChange={(event) =>
          updateForm(
            "price",
            event.target.value
          )
        }
      />
    </label>


    <label>
      COLUMN

      <select
        value={form.columnPosition}
        onChange={(event) =>
          updateForm(
            "columnPosition",
            event.target.value
          )
        }
      >
        <option value="1">
          COLUMN 1
        </option>

        <option value="2">
          COLUMN 2
        </option>

        <option value="3">
          COLUMN 3
        </option>
      </select>
    </label>


    <label>
      ORDER

      <input
        type="number"
        min="1"
        value={form.sortOrder}
        onChange={(event) =>
          updateForm(
            "sortOrder",
            event.target.value
          )
        }
      />
    </label>

  </div>


  {/* DESCRIPTION */}

  <label>
    DESCRIPTION

    <textarea
      rows="4"
      value={form.description}
      onChange={(event) =>
        updateForm(
          "description",
          event.target.value
        )
      }
    />
  </label>


  {/* PALETTE */}

  <div className="admin-palette-section">

    <div className="admin-palette-heading">
      <label>PALETTE</label>

      <span>
        {form.palette?.length || 0} COLORS
      </span>
    </div>


    <div className="admin-palette-list">

      {(form.palette || []).map(
        (color, index) => (
          <div
            className="admin-palette-color"
            key={`${index}-${color}`}
          >

            <input
              type="color"
              value={
                /^#[0-9A-Fa-f]{6}$/.test(color)
                  ? color
                  : "#000000"
              }
              onChange={(event) => {
                const newPalette = [
                  ...(form.palette || []),
                ];

                newPalette[index] =
                  event.target.value;

                updateForm(
                  "palette",
                  newPalette
                );
              }}
            />


            <input
              type="text"
              value={color}
              maxLength={7}
              placeholder="#000000"
              onChange={(event) => {
                const newPalette = [
                  ...(form.palette || []),
                ];

                newPalette[index] =
                  event.target.value;

                updateForm(
                  "palette",
                  newPalette
                );
              }}
            />


            <button
              type="button"
              className="admin-remove-color"
              onClick={() => {
                const newPalette = (
                  form.palette || []
                ).filter(
                  (_, colorIndex) =>
                    colorIndex !== index
                );

                updateForm(
                  "palette",
                  newPalette
                );
              }}
            >
              ×
            </button>

          </div>
        )
      )}

    </div>


    <button
      type="button"
      className="admin-add-palette"
      onClick={() => {
        const newPalette = [
          ...(form.palette || []),
          "#000000",
        ];

        updateForm(
          "palette",
          newPalette
        );
      }}
    >
      + ADD COLOR
    </button>

  </div>


  {/* VISIBILITY */}

  <div className="admin-checkboxes">

    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={form.showOnHome}
        onChange={(event) =>
          updateForm(
            "showOnHome",
            event.target.checked
          )
        }
      />

      SHOW ON HOME
    </label>


    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={form.showInShop}
        onChange={(event) =>
          updateForm(
            "showInShop",
            event.target.checked
          )
        }
      />

      SHOW IN SHOP
    </label>


    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={form.available}
        onChange={(event) =>
          updateForm(
            "available",
            event.target.checked
          )
        }
      />

      AVAILABLE FOR SALE
    </label>

  </div>


  {/* SUBMIT */}

  <button
    type="submit"
    className="admin-button"
    disabled={
      uploading ||
      savingEdit
    }
  >
    {editingArtwork
      ? savingEdit
        ? "SAVING..."
        : "SAVE CHANGES"
      : uploading
      ? "UPLOADING..."
      : "PUBLISH ARTWORK"}
  </button>

</form>
            </section>


            <section className="admin-artworks">

              <div className="admin-section-heading">
                <h2>
                  YOUR ARTWORKS
                </h2>

                <span>
                  {artworks.length} ITEMS
                </span>
              </div>


              {loadingArtworks ? (
                <p>
                  Loading artworks...
                </p>
              ) : artworks.length ===
                0 ? (
                <p>
                  No artworks yet.
                </p>
              ) : (
                <div className="admin-artwork-list">

                  {artworks.map(
                    (artwork) => (
                      <article
                        className="admin-artwork-item"
                        key={
                          artwork.id
                        }
                      >

                        <img
                          src={
                            artwork.image_url
                          }
                          alt={
                            artwork.title ||
                            "Artwork"
                          }
                        />

                        <div className="admin-artwork-info">

                          <h3>
                            {artwork.title ||
                              "Untitled"}
                          </h3>

                          <p>
                            {artwork.medium ||
                              "No medium"}
                          </p>

                          <small>
                            {
                              artwork.year
                            }
                          </small>

                        </div>


                        <div className="admin-artwork-controls">

                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={
                                artwork.show_on_home
                              }
                              onChange={(
                                event
                              ) =>
                                updateArtwork(
                                  artwork.id,
                                  "show_on_home",
                                  event.target
                                    .checked
                                )
                              }
                            />

                            HOME
                          </label>

                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={
                                artwork.show_in_shop
                              }
                              onChange={(
                                event
                              ) =>
                                updateArtwork(
                                  artwork.id,
                                  "show_in_shop",
                                  event.target
                                    .checked
                                )
                              }
                            />

                            SHOP
                          </label>

                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={
                                artwork.available
                              }
                              onChange={(
                                event
                              ) =>
                                updateArtwork(
                                  artwork.id,
                                  "available",
                                  event.target
                                    .checked
                                )
                              }
                            />

                            AVAILABLE
                          </label>


                          <div className="admin-row-buttons">

                            <button
                              className="edit-button"
                              onClick={() =>
                                startEditing(
                                  artwork
                                )
                              }
                            >
                              EDIT
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                deleteArtwork(
                                  artwork
                                )
                              }
                            >
                              DELETE
                            </button>

                          </div>

                        </div>

                      </article>
                    )
                  )}

                </div>
              )}

            </section>
          </>
        )}

{/* =========================
    LAYOUT TAB
========================= */}

{activeTab === "layout" && (
  <AdminLayout
    artworks={artworks}
    fetchArtworks={fetchArtworks}
    setError={setError}
    setSuccess={setSuccess}
  />
)}


{/* =========================
    SKETCHBOOK TAB
========================= */}

{activeTab === "sketchbook" && (
  <AdminSketchbooks
    setError={setError}
    setSuccess={setSuccess}
  />
)}

        {/* =========================
            BLOG TAB
        ========================= */}

        {activeTab === "blog" && (
          <>
            <section className="admin-upload">

              <div className="admin-form-heading">

                <div>
                  <h2>
                    {editingBlogPost
                      ? "EDIT BLOG POST"
                      : "NEW BLOG POST"}
                  </h2>

                  {editingBlogPost && (
                    <p>
                      Editing:{" "}
                      <strong>
                        {
                          editingBlogPost.title
                        }
                      </strong>
                    </p>
                  )}
                </div>

                {editingBlogPost && (
                  <button
                    type="button"
                    className="admin-cancel"
                    onClick={
                      resetBlogForm
                    }
                  >
                    CANCEL EDIT
                  </button>
                )}

              </div>


              <form
                onSubmit={
                  saveBlogPost
                }
              >

                <label>
                  TITLE

                  <input
                    type="text"
                    value={
                      blogForm.title
                    }
                    onChange={(
                      event
                    ) =>
                      updateBlogForm(
                        "title",
                        event.target
                          .value
                      )
                    }
                    placeholder="Why I keep drawing faces"
                    required
                  />
                </label>


                <label>
                  EXCERPT

                  <textarea
                    rows="3"
                    value={
                      blogForm.excerpt
                    }
                    onChange={(
                      event
                    ) =>
                      updateBlogForm(
                        "excerpt",
                        event.target
                          .value
                      )
                    }
                    placeholder="A tiny introduction to the post..."
                  />
                </label>


                <label>
                  CONTENT
                </label>

                <BlogBlocksEditor
                  blocks={blogBlocks}
                  setBlocks={setBlogBlocks}
                />


                <div className="admin-checkboxes">

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={
                        blogForm.published
                      }
                      onChange={(
                        event
                      ) =>
                        updateBlogForm(
                          "published",
                          event.target
                            .checked
                        )
                      }
                    />

                    PUBLISH POST
                  </label>

                </div>


                <button
                  type="submit"
                  className="admin-button"
                >
                  {editingBlogPost
                    ? "SAVE CHANGES"
                    : blogForm.published
                    ? "PUBLISH POST"
                    : "SAVE DRAFT"}
                </button>

              </form>
            </section>


            <section className="admin-artworks">

              <div className="admin-section-heading">
                <h2>
                  YOUR BLOG POSTS
                </h2>

                <span>
                  {blogPosts.length} POSTS
                </span>
              </div>


              {loadingBlogPosts ? (
                <p>
                  Loading posts...
                </p>
              ) : blogPosts.length ===
                0 ? (
                <p>
                  No blog posts yet.
                </p>
              ) : (
                <div className="admin-blog-list">

                  {blogPosts.map(
                    (post) => (
                      <article
                        className="admin-blog-item"
                        key={post.id}
                      >

                        <div className="admin-blog-info">

                          <h3>
                            {post.title}
                          </h3>

                          <small>
                            {post.published
                              ? "PUBLISHED"
                              : "DRAFT"}
                          </small>

                          {post.excerpt && (
                            <p>
                              {
                                post.excerpt
                              }
                            </p>
                          )}

                        </div>


                        <div className="admin-blog-controls">

                          <button
                            className="edit-button"
                            onClick={() =>
                              startBlogEditing(
                                post
                              )
                            }
                          >
                            EDIT
                          </button>

                          <button
                            className="publish-toggle"
                            onClick={() =>
                              toggleBlogPublish(
                                post
                              )
                            }
                          >
                            {post.published
                              ? "UNPUBLISH"
                              : "PUBLISH"}
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              deleteBlogPost(
                                post
                              )
                            }
                          >
                            DELETE
                          </button>

                        </div>

                      </article>
                    )
                  )}

                </div>
              )}

            </section>
          </>
        )}

      </div>
    </div>
  );
}


/* =========================
   PLACEHOLDER PAGES
========================= */
function Shop() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  useEffect(() => {
    async function fetchShopArtworks() {
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .eq("show_in_shop", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("SHOP ERROR:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      const prepared = (data || []).map((artwork) => {
        const { data: urlData } =
          supabase.storage
            .from("artworks")
            .getPublicUrl(artwork.image_path);

        return {
          ...artwork,
          image_url: urlData.publicUrl,
        };
      });

      setArtworks(prepared);
      setLoading(false);
    }

    fetchShopArtworks();
  }, []);

  /* =========================
     FULLSCREEN ARTWORK
  ========================= */

  if (selectedArtwork) {
    return (
      <div
        className="artwork-detail"
        onClick={() => setSelectedArtwork(null)}
      >
        <button
          type="button"
          className="artwork-detail-close"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedArtwork(null);
          }}
          aria-label="Close artwork"
        >
          ×
        </button>

        {/* ARTWORK */}

        <div
          className="artwork-detail-image-wrap"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <img
            src={selectedArtwork.image_url}
            alt={
              selectedArtwork.title ||
              "Artwork"
            }
            className="artwork-detail-image"
          />
        </div>

        {/* INFO */}

        <div
          className="artwork-detail-info"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <h1>
            {selectedArtwork.title ||
              "Untitled"}
          </h1>

          <div className="artwork-detail-meta">
            {selectedArtwork.medium && (
              <span>
                {selectedArtwork.medium}
              </span>
            )}

            {selectedArtwork.year && (
              <span>
                {selectedArtwork.year}
              </span>
            )}
          </div>

          {/* PRICE */}

          <div className="artwork-detail-price">
            {selectedArtwork.available
              ? selectedArtwork.price !== null &&
                selectedArtwork.price !==
                  undefined
                ? `₹${selectedArtwork.price}`
                : "CONTACT"
              : "SOLD"}
          </div>

          {/* PALETTE */}

          {Array.isArray(
            selectedArtwork.palette
          ) &&
            selectedArtwork.palette.length > 0 && (
              <div className="artwork-detail-palette">

                <span className="palette-label">
                  PALETTE
                </span>

                <div className="palette-swatches">
                  {selectedArtwork.palette.map(
                    (color, index) => (
                      <div
                        className="palette-swatch"
                        key={`${color}-${index}`}
                      >
                        <span
                          className="palette-color"
                          style={{
                            backgroundColor:
                              color,
                          }}
                        />

                        <span className="palette-hex">
                          {color}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* DESCRIPTION */}

          {selectedArtwork.description && (
            <p className="artwork-detail-description">
              {selectedArtwork.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* =========================
     SHOP PAGE
  ========================= */

  return (
    <>
      <Header />

      <main className="shop-page">

        <div className="shop-heading">
          <span>SHOP</span>
          <h1>ARTWORKS</h1>
        </div>

        {loading && (
          <div className="shop-message">
            Loading artworks...
          </div>
        )}

        {!loading && error && (
          <div className="shop-message shop-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          artworks.length === 0 && (
            <div className="shop-message">
              No artworks available yet.
            </div>
          )}

        {!loading &&
          !error &&
          artworks.length > 0 && (
            <div className="shop-grid">

              {artworks.map((artwork) => (
                <article
                  className="shop-item"
                  key={artwork.id}
                  onClick={() =>
                    setSelectedArtwork(
                      artwork
                    )
                  }
                >
                  <div className="shop-image">
                    <img
                      src={artwork.image_url}
                      alt={
                        artwork.title ||
                        "Artwork"
                      }
                    />
                  </div>

                  <div className="shop-item-info">

                    <div className="shop-item-main">
                      <h2>
                        {artwork.title ||
                          "Untitled"}
                      </h2>

                      <p className="shop-meta">
                        {artwork.medium ||
                          "Artwork"}

                        {artwork.year && (
                          <>
                            {" · "}
                            {artwork.year}
                          </>
                        )}
                      </p>
                    </div>

                    <div className="shop-price">
                      {artwork.available
                        ? artwork.price !==
                            null &&
                          artwork.price !==
                            undefined
                          ? `₹${artwork.price}`
                          : "CONTACT"
                        : "SOLD"}
                    </div>

                  </div>
                </article>
              ))}

            </div>
          )}

      </main>
    </>
  );
}


// commission //


function Commission() {
  const [submitted, setSubmitted] =
    useState(false);

  function handleSubmit(event) {
    event.preventDefault();

    const formData =
      new FormData(event.target);

    const name =
      formData.get("name");

    const email =
      formData.get("email");

    const idea =
      formData.get("idea");

    const budget =
      formData.get("budget");

    const subject =
      encodeURIComponent(
        `Commission request from ${name}`
      );

    const body =
      encodeURIComponent(
        `Name: ${name}

Email: ${email}

Budget: ${budget}

Idea:
${idea}`
      );

    window.location.href =
      `mailto:karthik25ayu@gmail.com?subject=${subject}&body=${body}`;

    setSubmitted(true);
  }

  return (
    <>
      <Header />

      <main className="commission-page">
        <div className="commission-intro">
          <span>COMMISSION</span>

          <h1>
            WANT ME TO MAKE
            <br />
            SOMETHING?
          </h1>

          <p>
            Tell me what you're thinking.
            It can be specific, strange,
            unfinished, or somewhere in
            between.
          </p>
        </div>

        <form
          className="commission-form"
          onSubmit={handleSubmit}
        >
          <label>
            NAME
            <input
              type="text"
              name="name"
              required
            />
          </label>

          <label>
            EMAIL
            <input
              type="email"
              name="email"
              required
            />
          </label>

          <label>
            BUDGET
            <input
              type="text"
              name="budget"
              placeholder="₹"
            />
          </label>

          <label>
            TELL ME ABOUT IT
            <textarea
              name="idea"
              rows="8"
              required
              placeholder="What do you want me to make?"
            />
          </label>

          <button
            type="submit"
            className="commission-submit"
          >
            SEND REQUEST ↗
          </button>

          {submitted && (
            <p className="commission-note">
              Your email app should have
              opened with the request.
            </p>
          )}
        </form>
      </main>
    </>
  );
}

function Playground() {
  return (
    <>
      <Header />

      <main className="page-placeholder playground-placeholder">
        <p className="playground-kicker">
          PLAYGROUND
        </p>

        <h1>COME PLAY WITH COLOR.</h1>

        <p>
          Gradients, palettes, drawing and
          other little experiments.
        </p>
      </main>
    </>
  );
}

function About() {
  return (
    <>
      <Header />

      <section className="page-placeholder">
        <h1>ABOUT ME</h1>

        <p>
          Artist, maker, experimenter
          and professional art
          overthinker.
        </p>
      </section>
    </>
  );
}


/* =========================
   ROUTER
========================= */

function App() {
  return (
    <div className="site">
      <Routes>
        <Route
  path="/sketchbook"
  element={<SketchbookPage />}
/>

<Route
  path="/sketchbook/:id"
  element={<SketchbookPage />}
/>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/shop"
          element={<Shop />}
        />

        <Route
          path="/commission"
          element={
            <Commission />
          }
        />

        <Route
          path="/blog"
          element={<Blog />}
        />

        <Route
          path="/blog/:slug"
          element={
            <BlogPost />
          }
        />

        <Route
          path="/playground"
          element={
            <Playground />
          }
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/admin/login"
          element={
            <AdminLogin />
          }
        />

        <Route
          path="/admin"
          element={
            <AdminDashboard />
          }
        />

      </Routes>
    </div>
  );
}

export default App;