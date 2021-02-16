import React, { Component } from 'react';
import { Text, SafeAreaView, TouchableOpacity, View, Dimensions, Modal, TextInput, Image, FlatList, Platform , PermissionsAndroid } from 'react-native';
import Box from '../screens/neumorphButton';
import Feather from 'react-native-vector-icons/Feather';
import { CreateRoomButton, UpcomingRoom } from './audioRoomHome';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import RNFetchBlob from 'rn-fetch-blob';
import Share from 'react-native-share';
import dynamicLinks from '@react-native-firebase/dynamic-links';
const screenWidth = Dimensions.get('window').width;
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';
import { v4 as uuidv4 } from 'uuid'
import Toast from 'react-native-simple-toast'
import LottieView from 'lottie-react-native'

class scheduleRoom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scheduleRoomModalVisible: false,
      showDateTimePicker: false,
      dateTimeMode: 'date',
      active: false,
      dateTimeValue: new Date(), // This will contain the final Date/Time, use moment to acces individuallly.
      title: "",  //This will contain the final title after entering.
      description: "",  //This will contain the final description after entering.
      nothingScheduledYet: false,
      scheduledRoom: [],
      buttonLoading: false,
      loading:false
    };
    
  }
  async componentDidMount() {
    this.getScheduledRoom()
  }
  onChange = (event, selectedDate) => {
    const currentDate = selectedDate || this.state.dateTimeValue;
    this.setState({ showDateTimePicker: Platform.OS === 'ios' });
    this.setState({ dateTimeValue: currentDate, active: true });
  };
  showDate = () => {
    this.setState({ dateTimeMode: 'date' });
    this.setState({ showDateTimePicker: true });
  };
  showTime = () => {
    this.setState({ dateTimeMode: 'time' });
    this.setState({ showDateTimePicker: true });
  };
  getScheduledRoom = async () => {
    this.setState({loading:true})
    fetch('https://us-central1-keplr-4ff01.cloudfunctions.net/api/getScheduledRoom', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: this.props.user.user.username,
      })
    })
      .then((res) => {
        return res.json()
      })
      .then((res) => {
        // console.log("rooms: ", res['data'])
        if (res['data'].length == 0) {
          this.setState({ nothingScheduledYet: true })
        }
        this.setState({ scheduledRoom: res['data'] })
        this.setState({loading:false})
      })
      .catch((err) => {
        this.setState({loading:false})
        Toast.showWithGravity('We encountered an error. Please Try Again', Toast.SHORT, Toast.CENTER)
      })

  }
  createRoom = () => {
    // console.log("scheduled room")
    if (this.state.title == "" || this.state.description == "" || this.state.dateTimeValue < new Date()) {
      // console.log("it can\'t be empty")
      return
    }
    var roomID = uuidv4()
    //console.log("Users: ", this.props.user)
    // console.log(this.state.title)
    // console.log(this.state.description)
    // console.log(this.state.dateTimeValue)
    fetch('https://us-central1-keplr-4ff01.cloudfunctions.net/api/scheduleRoom', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roomId: roomID,
        title: this.state.title,
        description: this.state.description,
        dateTime: this.state.dateTimeValue,
        username: this.props.user.user.username,
        bio: this.props.user.user.bio,
        photoUrl: this.props.user.user.photoUrl,
      })
    })
      .then((res) => {
        return res.json()
      })
      .then((res) => {
        this.setState({ scheduleRoomModalVisible: false })
        Toast.showWithGravity('Room Scheduled Successfully', Toast.SHORT, Toast.CENTER)
        this.getScheduledRoom()
      })
      .catch((err) => {
        Toast.showWithGravity('We encountered an error. Please Try Again', Toast.SHORT, Toast.CENTER)
      })
  }

  deeplink = async (id) => {
    const link = await dynamicLinks().buildShortLink({
      link: 'https://keplr.org/' + id,
      // domainUriPrefix is created in your Firebase console
      domainUriPrefix: 'https://keplr.page.link',
      android: {
        packageName: 'com.keplr',
      },
      ios: {
        bundleId: 'com.keplrapp'
      }
    }, dynamicLinks.ShortLinkType.SHORT);
    // console.log(link);
    return link;

  }
  // ------------- SHARE ROOM FUNCTION @aryaman: Dated: Feb 8, 2020 -> Add Deep Link in message on line 97 -------------------------
  onShareFunction = async (id) => {
    let shareLink = await this.deeplink(id);
    // this.setState({ shareLoading: true })
    let file_url = "https://firebasestorage.googleapis.com/v0/b/keplr-4ff01.appspot.com/o/keplr-share.png?alt=media&token=3c6ed63b-d7ea-418e-a911-4899113033c8";

    let imagePath = null;
    RNFetchBlob.config({
      fileCache: true
    })
      .fetch("GET", file_url)
      .then(resp => {
        imagePath = resp.path();
        return resp.readFile("base64");
      })
      .then(async base64Data => {
        var base64Data = `data:image/png;base64,` + base64Data;
        await Share.open({
          url: base64Data,
          message: "Join us on Keplr! \n" + shareLink
        });
        return fs.unlink(imagePath);
      }).catch(error => {
        // this.setState({ shareLoading: false })
      });
    // this.setState({ shareLoading: false })
  }

  render() {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgb(233, 235, 244)' }}>
        <BackButtonAndTitle navigation={this.props.navigation} title="Scheduled Rooms" />
        {this.state.loading ?
        (<View style={{ flex: 1, justifyContent: 'center', marginBottom: 60 }}>
        {/* <ActivityIndicator size="large" color="#3a7bd5" /> */}
        <LottieView
          source={require('../../Assets/rocket.json')}
          autoPlay
          loop
          speed={1.5}
          style={{
            height: 200,
            // marginTop: '30%',
            alignSelf: 'center',
          }}
        />
        <Text style={{
          color: '#3a7bd5',
          fontSize: 14,
          fontWeight: 'bold', alignSelf: 'center'
        }}>
          Establishing connection with exo...
        </Text>
      </View> ) 
      
      :
        this.state.nothingScheduledYet ? (
          <View
            style={{
              alignSelf: 'center',
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              marginBottom: 80,
            }}>
            <Image
              style={{ height: '50%', width: '60%', resizeMode: 'contain' }}
              source={require('../../Assets/image.png')}
            />
            <Text
              style={{
                alignSelf: 'center',
                color: '#7f7f7f',
                fontSize: 17,
                marginTop: 10,
                textAlign: 'center'
              }}>
              <Text style={{ fontWeight: 'bold' }}>No rooms scheduled yet.</Text>
              {`\n`}Schedule a room and {`\n`}let the fun begin.
              </Text>
          </View>
        ) : (

            <View
            style={{ paddingBottom: 80 }}
            >
              <FlatList
                data={this.state.scheduledRoom}
                extraData={this.state.buttonLoading}
                style={{ paddingBottom: 15 }}
                horizontal={false}
                keyExtractor={(item) => item.roomId}
                renderItem={({ item }) => {

                  var loading = false

                  if (this.state.buttonLoading === item.roomId) {
                    loading = true
                  }

                  return (

                    <UpcomingRoom
                      loading={loading}
                      hashtag={item.hashtag}
                      caption={item.caption}
                      photoUrl={item.creatorPhotoUrl}
                      username={item.creator} //Here display full name, not username plz.
                      date={moment(item.dateTime).format('MMMM Do YYYY')}
                      time={moment(item.dateTime).format('h:mm A')}
                      startNow={true}
                      startNowFunction={async () => {
                        var audio = true
                        if (Platform.OS === 'android') {
                          audio = await PermissionsAndroid.check('android.permission.RECORD_AUDIO')
                        }
                        if (this.props.connected) {
                          if (audio) {

                            this.setState({ buttonLoading: item.roomId })

                            fetch('https://us-central1-keplr-4ff01.cloudfunctions.net/api/startScheduled', {
                              method: 'POST',
                              headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                roomId: item.roomId,
                                hashtag: item.hashtag,
                                caption: item.caption,
                                username: this.props.user.user.username,
                                photoUrl: this.props.user.user.photoUrl

                              })
                            })
                              .then((res) => {
                                return res.json()
                              })
                              .then((res) => {

                                if (res.token === 'error') {

                                  this.setState({ buttonLoading: false })
                                  Toast.show('Whoops, a server error. Please try again', Toast.SHORT)

                                }
                                else {

                                  this.setState({ buttonLoading: false })
                                  this.props.navigation.navigate('audioRoom', { caption: item.caption, hashtag: item.hashtag, roomId: item.roomId, role: 3, agoraToken: res.token })

                                }

                              })
                          }

                          else {
                            Toast.showWithGravity('Please give permission to access to audio in order to create a townhall', Toast.SHORT, Toast.CENTER)
                          }
                        }
                        else {
                          Toast.showWithGravity('Disconnected from internet. Can\'t create hall', Toast.SHORT, Toast.CENTER)
                        }
                      }}
                      shareFunction={async () => {
                        await this.onShareFunction(item.roomId)
                      }}
                    />

                  )

                }}
              />
            </View>


          )}
        <ScheduleRoomPopUp
          scheduleRoomModalVisible={this.state.scheduleRoomModalVisible}
          active={this.state.active}
          onChangeTitle={(text) => {
            this.setState({ title: text })
          }}
          onChangeDescription={(text) => {
            this.setState({ description: text })
          }}
          date={moment(this.state.dateTimeValue).format('MMMM Do YYYY, dddd')}
          onPressDate={() => {
            this.showDate();
            // console.log('date');
          }}
          time={moment(this.state.dateTimeValue).format('h:mm A')}
          onPressTime={() => {
            this.showTime();
            // console.log('time');
          }}
          toggleScheduleRoomModal={() => {
            this.setState({ scheduleRoomModalVisible: false, active: false })
          }}
          createRoom={this.createRoom}
        />
        {this.state.showDateTimePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={this.state.dateTimeValue}
            mode={this.state.dateTimeMode}
            is24Hour={false}
            display="default"
            onChange={this.onChange}
          />
        )}
        <BottomBar
          name="SCHEDULE NEW ROOM"
          onPress={() => {
            this.setState({ scheduleRoomModalVisible: true })
          }}
        />
      </SafeAreaView>
    )
  }
}
class BottomBar extends Component {
  render() {
    return (
      <View
        style={{
          paddingBottom: 10,
          borderTopWidth: 2,
          borderTopColor: 'rgba(191,191,191,0.3)',
          backgroundColor: 'rgb(233, 235, 244)',
          alignItems: 'center',
          width: '100%',
          position: 'absolute',
          bottom: 0,
          zIndex: 5,
          flexDirection: 'row',
          justifyContent: 'center'
        }}>
        <CreateRoomButton
          height={40}
          width={screenWidth * 0.8}
          text={this.props.name}
          borderRadius={20}
          createRoom={this.props.onPress}
        />
      </View>
    );
  }
}
export class BackButtonAndTitle extends Component {
  render() {
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 15,
          marginHorizontal: 15,
          borderBottomColor: 'rgba(191,191,191,0.3)',
          borderBottomWidth: 2,
          borderRadius: 2,
        }}>
        <TouchableOpacity
          style={{ marginTop: 5 }}
          onPress={() => this.props.navigation.goBack()}>
          <Box height={50} width={50} borderRadius={10}>
            <Feather
              name="chevron-left"
              color="#B5BFD0"
              size={40}
              style={{ alignSelf: 'center', marginTop: 5 }}
            />
          </Box>
        </TouchableOpacity>
        <Text
          style={{
            color: '#3a7bd5',
            fontSize: 30,
            fontWeight: 'bold',
          }}>
          {this.props.title}
        </Text>
      </View>
    );
  }
}
class ScheduleRoomPopUp extends Component {
  render() {
    return (
      <Modal
        animationType='fade'
        transparent={true}
        visible={this.props.scheduleRoomModalVisible}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
        }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}>
          <View
            style={{
              width: '80%',
              borderWidth: 3,
              borderColor: '#e5e5e5',
              backgroundColor: 'rgb(233, 235, 244)',
              borderRadius: 10,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 10,
                alignItems: 'center',
                paddingHorizontal: 15,
              }}>
              <Text
                style={{
                  color: '#3a7bd5',
                  fontWeight: 'bold',
                  fontSize: 20,
                  alignSelf: 'center'
                }}>
                Schedule a Room
                </Text>
                <TouchableOpacity
                  onPress={this.props.toggleScheduleRoomModal}
                >
              <Feather
                name="x-circle"
                style={{ color: '#3a7bd5' }}
                size={25}
                
              />
              </TouchableOpacity>
            </View>
            <View
              style={{
                marginTop: 10,
                borderBottomColor: '#BFBFBF',
                borderBottomWidth: 2,
                borderRadius: 2,
                width: '100%',
                opacity: 0.2,
              }}
            />
            <Box
              height={40}
              width={275}
              borderRadius={20}
              style={{ alignSelf: 'center', marginTop: 10 }}
              styleChildren={{ justifyContent: 'center' }}
            >
              <TextInput
                placeholder="Title of the hall"
                placeholderTextColor="#B5BFD0"
                color="#343434"
                style={{
                  fontWeight: 'bold',
                  paddingHorizontal: 20,
                  width: '100%',
                }}
                onChangeText={this.props.onChangeTitle}
              />
            </Box>
            <Box
              height={40}
              width={275}
              borderRadius={20}
              style={{ alignSelf: 'center' }}>
              <TextInput
                placeholder="Description"
                placeholderTextColor="#B5BFD0"
                color="#343434"
                style={{
                  fontWeight: 'bold',
                  paddingHorizontal: 20,
                  width: '100%',
                }}
                onChangeText={this.props.onChangeDescription}
              />
            </Box>
            <TouchableOpacity onPress={this.props.onPressDate}>
              <Box
                height={40}
                width={275}
                borderRadius={20}
                style={{ alignSelf: 'center' }}
                styleChildren={{ justifyContent: 'center' }}
              >
                <Text
                  style={{
                    fontWeight: 'bold',
                    paddingHorizontal: 20,
                    width: '100%',
                    color: this.props.active ? '#343434' : '#B5BFD0'
                  }}>
                  {this.props.active ? this.props.date : "Date"}
                </Text>
                <Feather
                  name="calendar"
                  style={{ color: '#B5BFD0', position: 'absolute', top: 10, right: 15 }}
                  size={20}
                />
              </Box>
            </TouchableOpacity>
            <TouchableOpacity onPress={this.props.onPressTime}>
              <Box
                height={40}
                width={275}
                borderRadius={20}
                style={{ alignSelf: 'center' }}
                styleChildren={{ justifyContent: 'center' }}
              >
                <Text
                  style={{
                    fontWeight: 'bold',
                    paddingHorizontal: 20,
                    width: '100%',
                    color: this.props.active ? '#343434' : '#B5BFD0'
                  }}>
                  {this.props.active ? this.props.time : "Time"}
                </Text>
                <Feather
                  name="clock"
                  style={{ color: '#B5BFD0', position: 'absolute', top: 10, right: 15 }}
                  size={20}
                />
              </Box>
            </TouchableOpacity>
            <View style={{ alignSelf: 'center', marginTop: 10, marginBottom: 15 }}>
              <CreateRoomButton
                height={40}
                width={0.65 * screenWidth}
                // loading={this.state.createLoading}
                borderRadius={20}
                text="DONE"
                createRoom={this.props.createRoom}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    user: state.user,
    connected: state.rooms.connected
  };
};

export default connect(mapStateToProps)(withNavigation(scheduleRoom));