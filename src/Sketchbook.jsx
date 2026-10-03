import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

import { supabase } from "./lib/supabaseClient";


/* =========================
   SKETCHBOOK HEADER
========================= */

function SketchbookHeader() {
  return (
    <header className="header">
      <Link
        to="/"
        className="logo"
      >
        KARTHIK
      </Link>

      <nav className="nav">
        <Link to="/shop">
          SHOP
        </Link>

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
   STORAGE URL
========================= */

function getPublicUrl(path) {
  if (!path) {
    return "";
  }

  const { data } =
    supabase.storage
      .from("sketchbooks")
      .getPublicUrl(path);

  return data.publicUrl;
}


/* =========================
   ARCHIVE
========================= */

function SketchbookArchive() {
  const [books, setBooks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function fetchBooks() {
      const {
        data,
        error,
      } = await supabase
        .from("sketchbooks")
        .select("*")
        .eq(
          "published",
          true
        )
        .order(
          "sort_order",
          {
            ascending: true,
          }
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "SKETCHBOOK LOAD ERROR:",
          error
        );

        setError(
          error.message
        );

        setLoading(false);

        return;
      }

      setBooks(
        data || []
      );

      setLoading(false);
    }

    fetchBooks();
  }, []);


  return (
    <>
      <SketchbookHeader />

      <main className="sketchbook-archive-page">

        <section className="sketchbook-archive-heading">

          <span>
            ARCHIVE
          </span>

          <h1>
            SKETCHBOOK
          </h1>

          <p>
            Pages, scribbles,
            unfinished ideas and
            things from the studio.
          </p>

        </section>


        {loading && (
          <div className="sketchbook-status">
            LOADING SKETCHBOOKS...
          </div>
        )}


        {!loading &&
          error && (
            <div className="sketchbook-status sketchbook-status-error">
              {error}
            </div>
          )}


        {!loading &&
          !error &&
          books.length === 0 && (
            <div className="sketchbook-status">
              NO SKETCHBOOKS YET.
            </div>
          )}


        {!loading &&
          !error &&
          books.length > 0 && (
            <section className="sketchbook-archive-grid">

              {books.map(
                (book) => (
                  <Link
                    key={book.id}
                    to={`/sketchbook/${book.id}`}
                    className="sketchbook-archive-card"
                  >

                    <div className="sketchbook-archive-cover">

                      <img
                        src={getPublicUrl(
                          book.cover_path
                        )}
                        alt={
                          book.title
                        }
                      />

                    </div>


                    <div className="sketchbook-archive-info">

                      <h2>
                        {book.title}
                      </h2>

                      <span>
                        {book.year || ""}
                      </span>

                    </div>

                  </Link>
                )
              )}

            </section>
          )}

      </main>
    </>
  );
}


/* =========================
   VIEWER
========================= */

function SketchbookViewer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const getPublicUrl = (path) => {
    const { data } = supabase.storage
      .from("sketchbooks")
      .getPublicUrl(path);

    return data.publicUrl;
  };

  useEffect(() => {
    async function fetchSketchbook() {
      setLoading(true);

      const { data: bookData, error: bookError } = await supabase
        .from("sketchbooks")
        .select("*")
        .eq("id", id)
        .eq("published", true)
        .single();

      if (bookError || !bookData) {
        setLoading(false);
        return;
      }

      const { data: pageData, error: pageError } = await supabase
        .from("sketchbook_pages")
        .select("*")
        .eq("sketchbook_id", id)
        .order("page_number", { ascending: true });

      if (pageError) {
        console.error(pageError);
      }

      setBook(bookData);
      setPages(pageData || []);
      setCurrentPage(0);
      setLoading(false);
    }

    fetchSketchbook();
  }, [id]);

  const totalPages = pages.length + 2;

const getPageUrl = (pageNumber) => {
  if (pageNumber === 0) {
    return getPublicUrl(book.cover_path);
  }

  const page = pages[pageNumber - 1];

  if (!page) {
    return null;
  }

  return getPublicUrl(page.image_path);
};

  const goToPage = (pageNumber) => {
    const target = Math.max(
      0,
      Math.min(pageNumber, totalPages - 1)
    );

    setCurrentPage(target);
  };

  const nextPage = () => {
    setCurrentPage((prev) =>
      Math.min(prev + 1, totalPages - 1)
    );
  };

  const previousPage = () => {
    setCurrentPage((prev) =>
      Math.max(prev - 1, 0)
    );
  };

  /*
    PRELOAD nearby pages.

    We load the pages around the current page so that
    moving forward/backward doesn't have to start from zero.
  */
  useEffect(() => {
    if (!book || totalPages <= 0) {
      return;
    }

    const pagesToPreload = [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];

    pagesToPreload.forEach((pageNumber) => {
      if (pageNumber < 0 || pageNumber >= totalPages) {
        return;
      }

      const url = getPageUrl(pageNumber);

      if (!url) {
        return;
      }

      const img = new Image();
      img.src = url;

      if (img.decode) {
        img.decode().catch(() => {});
      }
    });
  }, [currentPage, book, pages]);

  /*
    Keyboard navigation
  */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        nextPage();
      }

      if (event.key === "ArrowLeft") {
        previousPage();
      }

      if (event.key === "Escape") {
        navigate("/sketchbook");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate, totalPages]);

  /*
    Browser-style page input.
    Typing 19 means page 19.
    The cover is page 1.
  */
  const displayPageNumber = currentPage + 1;

  const handlePageInput = (event) => {
    const value = Number(event.target.value);

    if (!Number.isNaN(value)) {
      goToPage(value - 1);
    }
  };

  if (loading) {
    return (
      <div className="sketchbook-viewer">
        <div className="sketchbook-viewer-loading">
          Loading...
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="sketchbook-viewer">
        <div className="sketchbook-viewer-loading">
          Sketchbook not found.
        </div>
      </div>
    );
  }

  const currentImage = getPageUrl(currentPage);

  return (
    <div className="sketchbook-viewer">

      {/* Close */}
      <button
        type="button"
        className="sketchbook-viewer-close"
        onClick={() => navigate("/sketchbook")}
        aria-label="Close sketchbook"
      >
        ×
      </button>

      {/* Artwork page */}
      <div className="sketchbook-viewer-stage">
        {currentPage === totalPages - 1 ? (
  <div className="sketchbook-final-page">
    {book.description && (
      <p>{book.description}</p>
    )}
  </div>
) : (
  currentImage && (
    <img
      key={currentImage}
      src={currentImage}
      alt={`${book.title} page ${displayPageNumber}`}
      className="sketchbook-viewer-image"
      draggable="false"
    />
  )
)}
      </div>

      {/* ONE navigation indicator */}
      <div className="sketchbook-viewer-controls">

        <button
          type="button"
          onClick={previousPage}
          disabled={currentPage === 0}
          className="sketchbook-page-arrow"
          aria-label="Previous page"
        >
          ←
        </button>

        <input
          type="number"
          min="1"
          max={totalPages}
          value={displayPageNumber}
          onChange={handlePageInput}
          className="sketchbook-page-input"
          aria-label="Current page"
        />

        <span className="sketchbook-page-total">
          / {totalPages}
        </span>

        <button
          type="button"
          onClick={nextPage}
          disabled={currentPage === totalPages - 1}
          className="sketchbook-page-arrow"
          aria-label="Next page"
        >
          →
        </button>

      </div>
    </div>
  );
}

/* =========================
   PAGE ENTRY
========================= */

export default function SketchbookPage() {
  const { id } =
    useParams();

  return id ? (
    <SketchbookViewer />
  ) : (
    <SketchbookArchive />
  );
}