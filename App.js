import React, {useEffect, useState} from 'react';
import {Alert, View, Text, TextInput, Button, FlatList} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import database from '@react-native-firebase/database';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
}

function App() {
  const [todo, setTodo] = useState('');
  const [data, setData] = useState([]);
  const [isDone, setisDone] = useState(false);

  const getData = async () => {
    try {
      await database()
        .ref('todos')
        .on('value', (data) => {
          let _todo = [];
          data.forEach((datas) => {
            _todo = [..._todo, datas.val()];
          });
          setData(_todo);
        });
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    requestUserPermission();
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage), [
        {text: 'OK'},
      ]);
    });
    getData();
    return unsubscribe;
  }, []);
  function addTodo() {
    const addTodo = database().ref('todos').push({
      title: todo,
      time: Date.now(),
      isDone: false,
    });
    const todoId = addTodo.key;
    database().ref('todos').child(todoId).update({todoId: todoId});
  }
  function delTodo(todoId) {
    database()
      .ref('todos/' + todoId)
      .remove();
  }
  function toggleTodo(todoId) {
    setisDone(!isDone);
    database()
      .ref('todos/' + todoId)
      .update({isDone: isDone});
  }
  function listItem(props) {
    return (
      <View
        style={{
          flexDirection: 'row',
          marginVertical: 4,
          alignItems: 'center',
          backgroundColor: props.item.isDone ? 'gray' : 'aqua',
          justifyContent: 'space-between',
        }}>
        <Button
          title="Done"
          color={props.item.isDone ? 'aqua' : 'tomato'}
          onPress={() => toggleTodo(props.item.todoId)}
        />
        <Text>{props.item.title}</Text>
        <Text>{props.item.time}</Text>
        <Button
          title="Del"
          color="red"
          onPress={() => delTodo(props.item.todoId)}
        />
      </View>
    );
  }

  return (
    <View>
      <TextInput value={todo} onChangeText={(text) => setTodo(text)} />
      <Button title="Add" onPress={addTodo} />
      <FlatList
        data={data}
        renderItem={listItem}
        keyExtractor={(item, index) => String(index)}
      />
    </View>
  );
}

export default App;
