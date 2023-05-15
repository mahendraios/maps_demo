import React, { Component } from 'react';
import { View, TextInput, StyleSheet, Text, Keyboard, FlatList, TouchableOpacity, Button, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { connect } from 'react-redux';
import { storeHistory, clearHistory } from '../../store/slices/searchHistorySlice';

class MapsScreen extends Component {
    constructor(props) {
        super(props)
        this.state = {
            formattedAddress: "",
            showAddressListView: false,
            formattedAddress: "",
            isAddressSelected: false,
            addressLine2: "",
            formattedAddressValidity: false,
            NearBy: "",
            location: null,
            searchQuery: '',
            markers: [],
            markersData: [],
            region: {
                latitude: 30.50,
                longitude: -100.35,
                latitudeDelta: 30,
                longitudeDelta: 30,
            },
            addressList:[]
        }
        this.mapView = React.createRef();

    }
    componentDidMount() {
        let newRegion = {
            latitude: 30.50,
            longitude: -100.35,
            latitudeDelta: 60,
            longitudeDelta: 60,
        }

        setTimeout(() => {
            this.mapView.current.animateToRegion(newRegion, 1000);
            this.setState({ region: newRegion });
        }, 1000);
    }
    componentDidUpdate(prevProps) {
        if (prevProps.searchHistory !== this.props.searchHistory) {
            console.log(this.props.searchHistory);
        }
    }
    getRegionFromMarkers = (markers) => {
        // markers should look like [{coordinate: {latitude: __, longitude: __}} ...]
        let minLat, maxLat, minLng, maxLng;

        // Initialize the min and max from the first marker
        minLat = markers[0].coordinate.latitude;
        maxLat = markers[0].coordinate.latitude;
        minLng = markers[0].coordinate.longitude;
        maxLng = markers[0].coordinate.longitude;

        // Go through each marker, adjusting the min and max for latitude and longitude
        markers.forEach(marker => {
            minLat = Math.min(minLat, marker.coordinate.latitude);
            maxLat = Math.max(maxLat, marker.coordinate.latitude);
            minLng = Math.min(minLng, marker.coordinate.longitude);
            maxLng = Math.max(maxLng, marker.coordinate.longitude);
        });

        // Calculate the middle point
        const midLat = ((minLat + maxLat) / 2) - 10;
        const midLng = (minLng + maxLng) / 2;

        // Calculate the deltas
        const deltaLat = (maxLat - minLat) + 10;
        const deltaLng = (maxLng - minLng) + 10;

        // Set the new state for the region
        this.setState({
            region: {
                latitude: midLat,
                longitude: midLng,
                latitudeDelta: deltaLat,
                longitudeDelta: deltaLng,
            },
        }, () => {
            // Animate map to the new region
            this.mapView.current.animateToRegion(this.state.region, 1000);
        });
    }
    zoomIn = () => {
        const newRegion = {
            ...this.state.region,
            latitudeDelta: this.state.region.latitudeDelta / 2,
            longitudeDelta: this.state.region.longitudeDelta / 2,
        };
        this.mapView.current.animateToRegion(newRegion, 1000); // 1000ms animation
        this.setState({ region: newRegion });
    };

    zoomOut = () => {
        const newRegion = {
            ...this.state.region,
            latitudeDelta: this.state.region.latitudeDelta * 2,
            longitudeDelta: this.state.region.longitudeDelta * 2,
        };
        this.mapView.current.animateToRegion(newRegion, 1000); // 1000ms animation
        this.setState({ region: newRegion });
    };

    async fetchAdressesFromGoogle() {
        this.setState({ markersData: [] })
        // we have to take this url from Constants
        var url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?input={TEXT}&key={API_KEY}&language=en&components=country:us'.replace("{TEXT}", this.state.formattedAddress)
        var response = await fetch(url, {
            method: 'GET',
            headers: {}
        });
        const responseJson = await response.json();
        if (responseJson.status == "OK") {
            var predictions = responseJson.predictions
            this.setState({
                addressList: predictions,
                showAddressListView: true
            })
        }
    }
    parseGoogleLocationResponse(data) {
        const addressComponents = data.result.address_components;
        const streetNumber = addressComponents.find(component => component.types.includes('street_number')).long_name;
        const route = addressComponents.find(component => component.types.includes('route')).long_name;
        const locality = addressComponents.find(component => component.types.includes('locality')).long_name;
        const administrativeAreaLevel1 = addressComponents.find(component => component.types.includes('administrative_area_level_1')).long_name;
        const postalCode = addressComponents.find(component => component.types.includes('postal_code')).long_name;
        const country = addressComponents.find(component => component.types.includes('country')).long_name;
        var response = {
            streetNumber: streetNumber,
            route: route,
            locality: locality,
            administrativeAreaLevel1: administrativeAreaLevel1,
            postalCode: postalCode,
            country: country
        }
        return response
    }

    async fetchAdressesDetailsFromPlaceId(placeId) {
        // We have to take this Url from constants
        var url = "https://maps.googleapis.com/maps/api/place/details/json?place_id={PLACE_ID}&key={API_KEY}".replace("{PLACE_ID}", placeId)
        var response = await fetch(url, {
            method: 'GET',
            headers: {}
        });
        const responseJson = await response.json();
        if (responseJson.status == "OK") {
            var selectedAddress = this.parseGoogleLocationResponse(responseJson)
            this.setState({
                selectedAddress: selectedAddress
            }, () => {
                this.inputValidation('addressLine1')
            })
        }
    }
    async GetNewPlaceDetails(placeId, index) {
        // console.log(placeId)
                // We have to take this Url from constants

        var url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,geometry&key={API_KEY}`
        var response = await fetch(url, {
            method: 'GET',
            headers: {}
        });
        const responseJson = await response.json();
        let { markersData } = this.state
        let markersCopy = [...markersData]
        markersCopy.push(
            {
                id: index + 1,
                title: responseJson.result.name,
                description: responseJson.result.name,
                coordinate: { latitude: responseJson.result.geometry.location.lat, longitude: responseJson.result.geometry.location.lng },
            }
        )
        this.setState({ markersData: markersCopy }, () => { this.getRegionFromMarkers(this.state.markersData); })
    }

    inputValidation(type) {
        if (type == 'addressLine1') {
            if (this.state.isAddressSelected) {
                this.setState({
                    formattedAddressTouched: true,
                    formattedAddressValidity: true
                });
            }
            else {
                this.setState({
                    formattedAddressTouched: false,
                    formattedAddressValidity: false
                });
            }
        }
        if (type == 'addressLine2') {
            if (this.state.addressLine2.length > 0) {
                this.setState({
                    addressLine2Touched: true,
                    addressLine2Validity: true
                })
            }
            else {
                this.setState({
                    addressLine2Touched: false,
                    addressLine2Validity: false
                })
            }
        }
    }

    renderAddresses(item, index) {
        return (
            <TouchableOpacity
                onPress={() => {
                    this.setState({
                        formattedAddress: item.description,
                        isAddressSelected: true,
                        showAddressListView: false,
                    }, () => {
                        Keyboard.dismiss()
                        // this.fetchAdressesDetailsFromPlaceId(item.place_id)

                    })
                }}>
                <Text >
                    {item.description}
                </Text>
            </TouchableOpacity>
        )
    }

    renderMarkers() {
        return this.state.markersData.map((marker) => (
            <Marker
                key={marker.id}
                coordinate={marker.coordinate}
                title={marker.title}
                description={marker.description}
            />
        ));
    }

    render() {
        // as it is a sample one, I have used inline styles
        const { showAddressListView, formattedAddress, formattedAddressValidity, isAddressSelected, addressLine2 } = this.state
        return (
            <View>
                <TextInput
                    defaultValue={""}  // if the field is non editable by key-pad, then defaultValue should be implemented
                    value={formattedAddress}
                    // multiline={true}
                    placeholder="address"
                    placeholderTextColor='white'
                    editable={true}
                    // autoCapitalize={false}
                    onFocus={() => {
                        this.setState({
                            isAddressSelected: false
                        })
                    }}
                    onChangeText={(text) => {
                        this.setState({
                            formattedAddress: text
                        }, () => {
                            if (text.length > 2) {
                                if (!isAddressSelected) {
                                    this.fetchAdressesFromGoogle()
                                }
                            }
                        })
                    }}
                    onSubmitEditing={(text) => {
                    }}
                    maxLength={1000}
                    allowFontScaling={false}
                    secureTextEntry={false}
                    returnKeyType={'done'}
                    onEndEditing={() => {
                        if (this.state.formattedAddress.length > 2) {
                            
                            this.state.addressList.map((item, index) => { this.GetNewPlaceDetails(item.place_id, index) })
                            this.props.storeHistory(formattedAddress);
                        }
                    }}
                />

                {/* {showAddressListView && */}
                <View>
                    <FlatList
                        data={[...this.props.searchHistory, ...this.state.addressList]}
                        renderItem={({ item, index }) => this.renderAddresses(item, index)}
                    />
                </View>
                {/* } */}
                <View style={{}}>
                    <MapView
                        initialRegion={this.state.region}
                        animateToRegion={this.state.region}
                        style={{ width: '100%', height: '80%' }}
                        ref={this.mapView}
                    >
                        {this.renderMarkers()}
                    </MapView>
                    <View style={[{ position: "absolute", bottom: "20%", right: "5%" }]}>
                        <Button title="Zoom In" onPress={this.zoomIn} />
                        <Button title="Zoom Out" onPress={this.zoomOut} />
                        <Button title="Delete History" onPress={() => { this.props.clearHistory(); }} />
                    </View>
                </View>
            </View>
        )
    }
}
const mapDispatchToProps = {
    storeHistory,
    clearHistory
}
const mapStateToProps = state => {
    return {
        searchHistory: state.searchHistory.history,
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(MapsScreen);
