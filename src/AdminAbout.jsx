import {
  useEffect,
  useState,
} from "react";

import { supabase } from "./lib/supabaseClient";


/* =========================================================
   HELPERS
========================================================= */

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
      .from("about")
      .getPublicUrl(path);

  return data.publicUrl;
}


/* =========================================================
   IMAGE COMPRESSION
========================================================= */

async function prepareAboutImage(file) {
  if (!file) return null;

  if (!file.type.startsWith("image/")) {
    throw new Error(
      "Only image files are allowed."
    );
  }

  const MAX_SIZE = 2000;

  const image = new Image();

  const objectUrl =
    URL.createObjectURL(file);

  try {
    await new Promise(
      (resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = objectUrl;
      }
    );

    let width = image.width;
    let height = image.height;

    if (
      width > MAX_SIZE ||
      height > MAX_SIZE
    ) {
      const scale = Math.min(
        MAX_SIZE / width,
        MAX_SIZE / height
      );

      width = Math.round(
        width * scale
      );

      height = Math.round(
        height * scale
      );
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width = width;
    canvas.height = height;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      throw new Error(
        "Could not process image."
      );
    }

    ctx.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    const blob =
      await new Promise(
        (resolve) => {
          canvas.toBlob(
            resolve,
            "image/jpeg",
            0.88
          );
        }
      );

    if (!blob) {
      throw new Error(
        "Could not compress image."
      );
    }

    return new File(
      [blob],
      "about-photo.jpg",
      {
        type: "image/jpeg",
        lastModified:
          Date.now(),
      }
    );
  } finally {
    URL.revokeObjectURL(
      objectUrl
    );
  }
}


/* =========================================================
   UPLOAD
========================================================= */

async function uploadAboutImage(file) {
  const prepared =
    await prepareAboutImage(file);

  const path =
    `${uniqueId()}-about-photo.jpg`;

  const {
    error,
  } =
    await supabase.storage
      .from("about")
      .upload(
        path,
        prepared,
        {
          upsert: false,
          cacheControl:
            "31536000",
          contentType:
            "image/jpeg",
        }
      );

  if (error) {
    throw error;
  }

  return path;
}


/* =========================================================
   ADMIN ABOUT
========================================================= */

export default function AdminAbout({
  setError,
  setSuccess,
}) {
  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [name, setName] =
    useState("");

  const [intro, setIntro] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [imageShape, setImageShape] =
    useState("natural");

  const [imagePath, setImagePath] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [preview, setPreview] =
    useState("");


  /* =======================================================
     FETCH
  ======================================================= */

  async function fetchAbout() {
    setLoading(true);

    const {
      data,
      error,
    } =
      await supabase
        .from("about_page")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

    if (error) {
      console.error(
        "ABOUT FETCH ERROR:",
        error
      );

      setError(
        error.message
      );

      setLoading(false);

      return;
    }

    if (data) {
      setName(
        data.name || ""
      );

      setIntro(
        data.intro || ""
      );

      setBio(
        data.bio || ""
      );

      setImageShape(
        data.image_shape ||
          "natural"
      );

      setImagePath(
        data.image_path || ""
      );

      setPreview(
        data.image_path
          ? publicUrl(
              data.image_path
            )
          : ""
      );
    }

    setLoading(false);
  }


  useEffect(() => {
    fetchAbout();
  }, []);


  /* =======================================================
     IMAGE CHANGE
  ======================================================= */

  function handleImageChange(
    event
  ) {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Choose an image file."
      );

      return;
    }

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(
        preview
      );
    }

    setSelectedFile(file);

    setPreview(
      URL.createObjectURL(
        file
      )
    );

    setError("");
    setSuccess("");
  }


  /* =======================================================
     SAVE
  ======================================================= */

  async function saveAbout(
    event
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    let currentImagePath =
      imagePath;

    try {
      /* ---------------------------------------------------
         NEW IMAGE
      --------------------------------------------------- */

      if (selectedFile) {
        const newPath =
          await uploadAboutImage(
            selectedFile
          );

        currentImagePath =
          newPath;
      }


      /* ---------------------------------------------------
         SAVE DATABASE
      --------------------------------------------------- */

      const {
        error,
      } =
        await supabase
          .from("about_page")
          .upsert(
            {
              id: 1,

              name:
                name.trim(),

              intro:
                intro.trim(),

              bio:
                bio.trim(),

              image_path:
                currentImagePath ||
                null,

              image_shape:
                imageShape,

              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict:
                "id",
            }
          );

      if (error) {
        if (
          selectedFile &&
          currentImagePath !==
            imagePath
        ) {
          await supabase.storage
            .from("about")
            .remove([
              currentImagePath,
            ]);
        }

        throw error;
      }


      /* ---------------------------------------------------
         DELETE OLD IMAGE
      --------------------------------------------------- */

      if (
        selectedFile &&
        imagePath &&
        currentImagePath !==
          imagePath
      ) {
        await supabase.storage
          .from("about")
          .remove([
            imagePath,
          ]);
      }


      setImagePath(
        currentImagePath
      );

      setSelectedFile(null);

      const fileInput =
        document.getElementById(
          "about-image"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      setSuccess(
        "About page saved."
      );

      await fetchAbout();

    } catch (error) {
      console.error(
        "ABOUT SAVE ERROR:",
        error
      );

      setError(
        error?.message ||
          "Could not save About page."
      );
    } finally {
      setSaving(false);
    }
  }


  /* =======================================================
     REMOVE IMAGE
  ======================================================= */

  async function removeImage() {
    if (!imagePath) {
      return;
    }

    const confirmed =
      window.confirm(
        "Remove the About photo?"
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const {
        error:
          storageError,
      } =
        await supabase.storage
          .from("about")
          .remove([
            imagePath,
          ]);

      if (storageError) {
        throw storageError;
      }

      const {
        error:
          updateError,
      } =
        await supabase
          .from("about_page")
          .update({
            image_path: null,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", 1);

      if (updateError) {
        throw updateError;
      }

      setImagePath("");

      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(
          preview
        );
      }

      setPreview("");

      setSuccess(
        "About photo removed."
      );

    } catch (error) {
      console.error(
        "ABOUT IMAGE ERROR:",
        error
      );

      setError(
        error?.message ||
          "Could not remove image."
      );
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return (
      <section className="admin-about">
        <div className="admin-loading">
          LOADING ABOUT PAGE...
        </div>
      </section>
    );
  }


  return (
    <section className="admin-about">

      {/* HEADER */}

      <div className="admin-form-heading">

        <div>
          <p className="admin-kicker">
            ABOUT PAGE
          </p>

          <h2>
            ABOUT ME
          </h2>

          <p>
            Edit the information shown
            on your public About page.
          </p>
        </div>

      </div>


      <form
        className="admin-about-form"
        onSubmit={saveAbout}
      >

        {/* IMAGE */}

        <div className="admin-about-image-section">

          <div className="admin-about-section-heading">
            <strong>
              PHOTO
            </strong>

            <span>
              {selectedFile
                ? "NEW IMAGE"
                : imagePath
                ? "CURRENT IMAGE"
                : "NO IMAGE"}
            </span>
          </div>


          <div className="admin-about-image-layout">

            <div
              className={`admin-about-image-preview shape-${imageShape}`}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="About preview"
                />
              ) : (
                <span>
                  NO PHOTO
                </span>
              )}
            </div>


            <div className="admin-about-image-controls">

              <label className="file-upload">

                <span>
                  UPLOAD PHOTO
                </span>

                <input
                  id="about-image"
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                />

                {selectedFile && (
                  <strong>
                    {selectedFile.name}
                  </strong>
                )}

              </label>


              {imagePath && (
                <button
                  type="button"
                  className="delete-button"
                  onClick={
                    removeImage
                  }
                  disabled={saving}
                >
                  REMOVE PHOTO
                </button>
              )}

            </div>

          </div>

        </div>


        {/* SHAPE */}

        <div className="admin-about-shape-section">

          <div className="admin-about-section-heading">
            <strong>
              IMAGE SHAPE
            </strong>

            <span>
              {imageShape.toUpperCase()}
            </span>
          </div>


          <div className="about-shape-options">

            {[
              ["natural", "NATURAL"],
              ["rectangle", "RECTANGLE"],
              ["square", "SQUARE"],
              ["circle", "CIRCLE"],
            ].map(
              ([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={
                    imageShape === value
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setImageShape(
                      value
                    )
                  }
                >
                  {label}
                </button>
              )
            )}

          </div>

        </div>


        {/* TEXT */}

        <div className="admin-about-text">

          <label>
            NAME

            <input
              type="text"
              value={name}
              onChange={(
                event
              ) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Karthik"
            />
          </label>


          <label>
            INTRO

            <textarea
              rows="4"
              value={intro}
              onChange={(
                event
              ) =>
                setIntro(
                  event.target.value
                )
              }
              placeholder="Artist, maker, experimenter..."
            />
          </label>


          <label>
            BIO

            <textarea
              rows="10"
              value={bio}
              onChange={(
                event
              ) =>
                setBio(
                  event.target.value
                )
              }
              placeholder="Tell people about yourself..."
            />
          </label>

        </div>


        {/* SAVE */}

        <button
          type="submit"
          className="admin-button"
          disabled={saving}
        >
          {saving
            ? "SAVING..."
            : "SAVE ABOUT PAGE"}
        </button>

      </form>

    </section>
  );
}