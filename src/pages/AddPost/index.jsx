import React, { useCallback, useMemo, useState } from 'react';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import SimpleMDE from 'react-simplemde-editor';

import 'easymde/dist/easymde.min.css';
import styles from './AddPost.module.scss';
import { useSelector } from 'react-redux';
import { selectIsAuth } from '../../redux/slices/auth';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useRef } from 'react';
import axios from '../../axios.js';
import { useEffect } from 'react';

export const AddPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuth = useSelector(selectIsAuth);
  const [isLoading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [tittle, setTittle] = useState('');
  const [tags, setTags] = useState('');
  const inputFileRef = useRef(null);
  const [imageUrl, setImageUrl] = useState();

  const isEditing = Boolean(id);

  const handleChangeFile = async (event) => {
    try {
      const formData = new FormData();
      const file = event.target.files[0];
      formData.append('image', file);
      const { data } = await axios.post('/upload', formData);
      setImageUrl(data.url);
    } catch (err) {
      console.warn(err)
      alert('Ошибка при загрузке файла!');
    }
  };

  const onClickRemoveImage = () => {
    setImageUrl('');
  };

  const onChange = useCallback((value) => {
    setText(value);
  }, []);

  const onSubmit = async () => {
    try {
      setLoading(true)
      const fields = {
        tittle,
        imageUrl,
        tags,
        text,
      }

      const { data } = isEditing ?
        await axios.patch(`/posts/${id}`, fields) :
        await axios.post('/posts', fields)

      const _id = isEditing ? id : data._id;

      navigate(`/posts/${_id}`)
    } catch (err) {
      console.warn(err);
      console.log('ошибка при создании статьи!');
    }
  }

  useEffect(() => {
    if (id) {
      axios.get(`/posts/${id}`).then(({ data }) => {
        setTittle(data.tittle);
        setTags(data.tags.join(','));
        setText(data.text);
        setImageUrl(data.imageUrl);
      }).catch(err => {
        console.warn(err);
        alert('Ошибка при получении статьи!')
      })
    }
  }, [])

  const options = useMemo(
    () => ({
      spellChecker: false,
      maxHeight: '400px',
      autofocus: true,
      placeholder: 'Введите текст...',
      status: false,
      autosave: {
        enabled: true,
        delay: 1000,
      },
    }),
    [],
  );

  if (!isAuth) {
    return <Navigate to='/' />
  }

  return (
    <Paper style={{ padding: 30 }}>
      <Button onClick={() => inputFileRef.current.click()} variant="outlined" size="large">
        Загрузить превью
      </Button>
      <input ref={inputFileRef}
        type="file"
        onChange={handleChangeFile}
        hidden />
      {imageUrl && (
        <Button variant="contained" color="error" onClick={onClickRemoveImage}>
          Удалить
        </Button>
      )}
      {imageUrl && (
        <img className={styles.image} src={`${process.env.REACT_APP_API_URL}${imageUrl}`} alt="Uploaded" />
      )}
      <br />
      <br />
      <TextField
        classes={{ root: styles.title }}
        variant="standard"
        placeholder="Заголовок статьи..."
        value={tittle}
        onChange={(e) => setTittle(e.target.value)}
        fullWidth
      />
      <TextField classes={{ root: styles.tags }}
        variant="standard"
        placeholder="Тэги"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        fullWidth />
      <SimpleMDE className={styles.editor} value={text} onChange={onChange} options={options} />
      <div className={styles.buttons}>
        <Button onClick={onSubmit} size="large" variant="contained">
          {isEditing ? "Сохранить" : "Опубликовать"}
        </Button>
        <a href="/">
          <Button size="large">Отмена</Button>
        </a>
      </div>
    </Paper>
  );
};
