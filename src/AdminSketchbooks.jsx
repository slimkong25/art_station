import { useEffect, useState } from "react";

import { supabase } from "./lib/supabaseClient";


/* =========================
   HELPERS
========================= */

function uniqueId() {
  return (
    `${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}


function publicUrl(path) {
  if (!path) return "";

  const { data } =
    supabase.storage
      .from("sketchbooks")
      .getPublicUrl(path);

  return data.publicUrl;
}


/* =========================
   ADMIN SKETCHBOOKS
========================= */

export default function AdminSketchbooks({
  setError,
  setSuccess,
}) {
  const [books, setBooks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editingBook, setEditingBook] =
    useState(null);

  const [title, setTitle] =
    useState("");

  const [year, setYear] =
    useState(
      new Date().getFullYear()
    );

  const [description, setDescription] =
    useState("");

  const [published, setPublished] =
    useState(true);

  const [coverFile, setCoverFile] =
    useState(null);

  const [pageFiles, setPageFiles] =
    useState([]);

  const [existingPages, setExistingPages] =
    useState([]);


  /* =========================
     FETCH BOOKS
  ========================= */

  async function fetchBooks() {
    setLoading(true);

    const { data, error } =
      await supabase
        .from("sketchbooks")
        .select("*")
        .order("sort_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(error);
      setError(error.message);
      setLoading(false);
      return;
    }

    const prepared =
      await Promise.all(
        (data || []).map(
          async (book) => {
            const {
              count,
            } = await supabase
              .from(
                "sketchbook_pages"
              )
              .select(
                "*",
                {
                  count:
                    "exact",
                    head: true,
                }
              )
              .eq(
                "sketchbook_id",
                book.id
              );

            return {
              ...book,
              page_count:
                (count || 0) + 1,
            };
          }
        )
      );

    setBooks(prepared);
    setLoading(false);
  }


  useEffect(() => {
    fetchBooks();
  }, []);


  /* =========================
     RESET
  ========================= */

  function resetForm() {
    setEditingBook(null);

    setTitle("");

    setYear(
      new Date().getFullYear()
    );

    setDescription("");

    setPublished(true);

    setCoverFile(null);

    setPageFiles([]);

    setExistingPages([]);

    const coverInput =
      document.getElementById(
        "sketchbook-cover"
      );

    const pagesInput =
      document.getElementById(
        "sketchbook-pages"
      );

    if (coverInput) {
      coverInput.value = "";
    }

    if (pagesInput) {
      pagesInput.value = "";
    }
  }


  /* =========================
     START EDIT
  ========================= */

  async function startEdit(book) {
    setError("");
    setSuccess("");

    setEditingBook(book);

    setTitle(
      book.title || ""
    );

    setYear(
      book.year ||
        new Date().getFullYear()
    );

    setDescription(
      book.description || ""
    );

    setPublished(
      Boolean(book.published)
    );

    setCoverFile(null);

    setPageFiles([]);

    const {
      data,
      error,
    } = await supabase
      .from("sketchbook_pages")
      .select("*")
      .eq(
        "sketchbook_id",
        book.id
      )
      .order("page_number", {
        ascending: true,
      });

    if (error) {
      setError(error.message);
      return;
    }

    setExistingPages(
      data || []
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  /* =========================
     PAGE FILES
  ========================= */

  function addPageFiles(event) {
    const incoming =
      Array.from(
        event.target.files || []
      );

    setPageFiles(
      (current) => [
        ...current,
        ...incoming,
      ]
    );
  }


  function removeNewPage(index) {
    setPageFiles(
      (current) =>
        current.filter(
          (_, i) =>
            i !== index
        )
    );
  }


  function moveNewPage(
    index,
    direction
  ) {
    setPageFiles(
      (current) => {
        const next = [
          ...current,
        ];

        const target =
          index + direction;

        if (
          target < 0 ||
          target >= next.length
        ) {
          return current;
        }

        [
          next[index],
          next[target],
        ] = [
          next[target],
          next[index],
        ];

        return next;
      }
    );
  }


  /* =========================
     EXISTING PAGE MOVE
  ========================= */

  function moveExistingPage(
    index,
    direction
  ) {
    setExistingPages(
      (current) => {
        const next = [
          ...current,
        ];

        const target =
          index + direction;

        if (
          target < 0 ||
          target >= next.length
        ) {
          return current;
        }

        [
          next[index],
          next[target],
        ] = [
          next[target],
          next[index],
        ];

        return next;
      }
    );
  }


  /* =========================
     DELETE EXISTING PAGE
  ========================= */

  function removeExistingPage(
    index
  ) {
    setExistingPages(
      (current) =>
        current.filter(
          (_, i) =>
            i !== index
        )
    );
  }


  /* =========================
     UPLOAD FILE
  ========================= */

  async function uploadFile(
    file,
    folder
  ) {
    const safeName =
      file.name
        .toLowerCase()
        .replace(
          /[^a-z0-9.-]/g,
          "-"
        );

    const path =
      `${folder}/${uniqueId()}-${safeName}`;

    const {
      error,
    } = await supabase.storage
      .from("sketchbooks")
      .upload(
        path,
        file,
        {
          upsert: false,
        }
      );

    if (error) {
      throw error;
    }

    return path;
  }


  /* =========================
     SAVE
  ========================= */

  async function saveSketchbook(
    event
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError(
        "Sketchbook title is required."
      );
      return;
    }

    if (
      !editingBook &&
      !coverFile
    ) {
      setError(
        "Choose a cover image."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let coverPath =
        editingBook?.cover_path ||
        null;


      /* COVER */

      if (coverFile) {
        coverPath =
          await uploadFile(
            coverFile,
            "covers"
          );
      }


      /* CREATE */

      if (!editingBook) {
        const {
          data: newBook,
          error: insertError,
        } = await supabase
          .from("sketchbooks")
          .insert({
            title:
              title.trim(),

            description:
              description.trim(),

            year:
              Number(year),

            cover_path:
              coverPath,

            published,

            sort_order:
              books.length + 1,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }


        /* UPLOAD PAGES */

        for (
          let i = 0;
          i < pageFiles.length;
          i++
        ) {
          const path =
            await uploadFile(
              pageFiles[i],
              `pages/${newBook.id}`
            );

          const {
            error,
          } = await supabase
            .from(
              "sketchbook_pages"
            )
            .insert({
              sketchbook_id:
                newBook.id,

              page_number:
                i + 2,

              image_path:
                path,
            });

          if (error) {
            throw error;
          }
        }

        setSuccess(
          "Sketchbook added."
        );
      }


      /* EDIT */

      else {
        const {
          error:
            updateError,
        } = await supabase
          .from("sketchbooks")
          .update({
            title:
              title.trim(),

            description:
              description.trim(),

            year:
              Number(year),

            cover_path:
              coverPath,

            published,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            editingBook.id
          );

        if (updateError) {
          throw updateError;
        }


        /* REMOVE DELETED PAGES */

        const {
          data:
            storedPages,
        } = await supabase
          .from(
            "sketchbook_pages"
          )
          .select("*")
          .eq(
            "sketchbook_id",
            editingBook.id
          );


        const remainingPaths =
          new Set(
            existingPages.map(
              (page) =>
                page.image_path
            )
          );


        for (
          const page of
            storedPages || []
        ) {
          if (
            !remainingPaths.has(
              page.image_path
            )
          ) {
            await supabase.storage
              .from("sketchbooks")
              .remove([
                page.image_path,
              ]);

            await supabase
              .from(
                "sketchbook_pages"
              )
              .delete()
              .eq(
                "id",
                page.id
              );
          }
        }


        /* REORDER EXISTING */

        for (
          let i = 0;
          i < existingPages.length;
          i++
        ) {
          await supabase
            .from(
              "sketchbook_pages"
            )
            .update({
              page_number:
                i + 2,
            })
            .eq(
              "id",
              existingPages[i].id
            );
        }


        /* ADD NEW PAGES */

        for (
          let i = 0;
          i < pageFiles.length;
          i++
        ) {
          const path =
            await uploadFile(
              pageFiles[i],
              `pages/${editingBook.id}`
            );

          await supabase
            .from(
              "sketchbook_pages"
            )
            .insert({
              sketchbook_id:
                editingBook.id,

              page_number:
                existingPages.length +
                i +
                2,

              image_path:
                path,
            });
        }


        setSuccess(
          "Sketchbook updated."
        );
      }


      resetForm();
      await fetchBooks();

    } catch (error) {
      console.error(
        "SKETCHBOOK ERROR:",
        error
      );

      setError(
        error?.message ||
          "Could not save sketchbook."
      );
    } finally {
      setSaving(false);
    }
  }


  /* =========================
     DELETE BOOK
  ========================= */

  async function deleteSketchbook(
    book
  ) {
    const confirmed =
      window.confirm(
        `Delete "${book.title}" and all its pages?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const {
        data: pages,
        error:
          pageError,
      } = await supabase
        .from(
          "sketchbook_pages"
        )
        .select("image_path")
        .eq(
          "sketchbook_id",
          book.id
        );

      if (pageError) {
        throw pageError;
      }


      const paths = [
        book.cover_path,
        ...(pages || []).map(
          (page) =>
            page.image_path
        ),
      ];


      await supabase.storage
        .from("sketchbooks")
        .remove(paths);


      const {
        error,
      } = await supabase
        .from("sketchbooks")
        .delete()
        .eq(
          "id",
          book.id
        );

      if (error) {
        throw error;
      }

      setSuccess(
        "Sketchbook deleted."
      );

      await fetchBooks();

    } catch (error) {
      console.error(error);

      setError(
        error?.message ||
          "Could not delete sketchbook."
      );
    }
  }


 return (
  <section className="admin-sketchbooks">

    <div className="admin-form-heading">

      <div>
        <p className="admin-kicker">
          NOTEBOOK ARCHIVE
        </p>

        <h2>
          {editingBook
            ? "EDIT SKETCHBOOK"
            : "ADD SKETCHBOOK"}
        </h2>

        <p>
          One book. One cover. Multiple pages.
        </p>
      </div>

      {editingBook && (
        <button
          type="button"
          className="admin-cancel"
          onClick={resetForm}
        >
          CANCEL EDIT
        </button>
      )}

    </div>


    <form
      className="admin-sketchbook-form"
      onSubmit={saveSketchbook}
    >

      {/* COVER */}

      <div className="sketchbook-image-upload">

        <label>
          COVER / PAGE 1

          <input
            id="sketchbook-cover"
            type="file"
            accept="image/*"
            onChange={(event) =>
              setCoverFile(
                event.target.files?.[0] ||
                null
              )
            }
            required={!editingBook}
          />

          {coverFile && (
            <strong className="sketchbook-file-name">
              {coverFile.name}
            </strong>
          )}

          {editingBook && !coverFile && (
            <small className="sketchbook-file-note">
              Current cover remains unchanged.
            </small>
          )}
        </label>

      </div>


      {/* BASIC INFO */}

      <div className="sketchbook-form-grid">

        <label>
          TITLE

          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Sketchbook 01"
            required
          />
        </label>


        <label>
          YEAR

          <input
            type="number"
            value={year}
            onChange={(event) =>
              setYear(event.target.value)
            }
          />
        </label>

      </div>


      {/* DESCRIPTION */}

      <label>
        DESCRIPTION

        <textarea
          rows="5"
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          placeholder="A collection of studies, pages, ideas..."
        />
      </label>


      {/* PAGES */}

     <div className="sketchbook-pages-upload">

  <label>
    ADD PAGES

    <input
      id="sketchbook-pages"
      type="file"
      accept="image/*"
      multiple
      onChange={(event) => {
        const files = Array.from(
          event.target.files || []
        );

        setPageFiles(files);
      }}
    />
  </label>

  <p className="sketchbook-upload-help">
    Select multiple images at once.
    They will become pages in the order
    shown below.
  </p>


  {pageFiles.length > 0 && (
    <div className="sketchbook-page-list">

      {pageFiles.map((file, index) => (
        <div
          className="sketchbook-admin-page"
          key={`${file.name}-${index}`}
        >

          <div className="sketchbook-admin-page-info">

            <strong>
              PAGE {index + 2}
            </strong>

            <span>
              {file.name}
            </span>

          </div>


          <div className="sketchbook-page-controls">

            <button
              type="button"
              onClick={() =>
                moveNewPage(
                  index,
                  -1
                )
              }
              disabled={index === 0}
            >
              ↑
            </button>


            <button
              type="button"
              onClick={() =>
                moveNewPage(
                  index,
                  1
                )
              }
              disabled={
                index ===
                pageFiles.length - 1
              }
            >
              ↓
            </button>


            <button
              type="button"
              onClick={() =>
                removeNewPage(index)
              }
            >
              ×
            </button>

          </div>

        </div>
      ))}

    </div>
  )}

</div>


      {/* EXISTING PAGES */}

      {editingBook &&
        existingPages.length > 0 && (
          <div className="sketchbook-existing-pages">

            <label>
              CURRENT PAGES
            </label>

            <div className="sketchbook-page-list">

              {existingPages.map(
                (page, index) => (
                  <div
                    className="sketchbook-admin-page"
                    key={page.id}
                  >

                    <div className="sketchbook-admin-page-info">

                      <strong>
                        PAGE {index + 2}
                      </strong>

                      <span>
                        EXISTING PAGE
                      </span>

                    </div>


                    <div className="sketchbook-page-controls">

                      <button
                        type="button"
                        onClick={() =>
                          moveExistingPage(
                            index,
                            -1
                          )
                        }
                        disabled={index === 0}
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          moveExistingPage(
                            index,
                            1
                          )
                        }
                        disabled={
                          index ===
                          existingPages.length - 1
                        }
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeExistingPage(
                            index
                          )
                        }
                      >
                        ×
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>
        )}


      {/* PUBLISH */}

      <div className="sketchbook-publish">

        <label className="checkbox-label">

          <input
            type="checkbox"
            checked={published}
            onChange={(event) =>
              setPublished(
                event.target.checked
              )
            }
          />

          PUBLISH SKETCHBOOK

        </label>

      </div>


      {/* SUBMIT */}

      <button
        type="submit"
        className="admin-button"
        disabled={saving}
      >
        {saving
          ? "SAVING..."
          : editingBook
          ? "SAVE CHANGES"
          : "PUBLISH SKETCHBOOK"}
      </button>

    </form>


    {/* EXISTING SKETCHBOOKS */}

    <section className="admin-sketchbook-list">

      <div className="admin-section-heading">

        <h2>
          YOUR SKETCHBOOKS
        </h2>

        <span>
          {books.length} BOOKS
        </span>

      </div>


      {loading ? (
        <p>
          Loading sketchbooks...
        </p>
      ) : books.length === 0 ? (
        <p>
          No sketchbooks yet.
        </p>
      ) : (
        <div className="admin-sketchbook-items">

          {books.map((book) => (
            <article
              className="admin-sketchbook-item"
              key={book.id}
            >

              <img
                src={publicUrl(
                  book.cover_path
                )}
                alt={book.title}
              />

              <div className="admin-sketchbook-item-info">

                <h3>
                  {book.title}
                </h3>

                <p>
                  {book.year}
                  {" · "}
                  {book.page_count} PAGES
                </p>

                <small>
                  {book.published
                    ? "PUBLISHED"
                    : "DRAFT"}
                </small>

              </div>


              <div className="admin-row-buttons">

                <button
                  type="button"
                  className="edit-button"
                  onClick={() =>
                    startEdit(book)
                  }
                >
                  EDIT
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() =>
                    deleteSketchbook(book)
                  }
                >
                  DELETE
                </button>

              </div>

            </article>
          ))}

        </div>
      )}

    </section>

  </section>
);
}