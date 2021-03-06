import React, {Component} from "react";
import {connect} from "react-redux";
import CurrentUser from "../component/user/CurrentUser";
import UserWithDeals from "../component/user/UserWithDeals";
import {
    getDealList,
    getEntities,
    getUserByParameter,
    loadingStatus,
    saveEntity,
    updateEntity
} from "../store/actions/entityActions";

class SalesRating extends Component {
    componentDidMount() {
        this.props.loadingStatus(true);
        let usersPromise = this.props.getEntities('users', {DATE_ACTIVE_FROM: 'ASC'});
        usersPromise.then(result => {
            if (result.data()) {
                let entities = {};
                const data = result.data();
                data.map((entity) => {
                    this.props.saveEntity(entity.PROPERTY_VALUES.ID_USER, entity)
                });
                console.log('users: ', this.props.entities);
                const usersIds = Object.keys(this.props.entities);
                let detailsPromise = this.props.getUserByParameter({"ID": usersIds});
                detailsPromise.then(result => {
                    let updatedEntities = {...this.props.entities};

                    let data = result.data();
                    for (let userIndex in data) {
                        let idUser = data[userIndex].ID;
                        updatedEntities[idUser].FIRST_NAME = data[userIndex].NAME;
                        updatedEntities[idUser].LAST_NAME = data[userIndex].LAST_NAME;
                        updatedEntities[idUser].MIDDLE_NAME = data[userIndex].SECOND_NAME;
                        updatedEntities[idUser].PERSONAL_PHOTO = data[userIndex].PERSONAL_PHOTO;
                        updatedEntities[idUser].SUM = 0;
                        updatedEntities[idUser].DEAL_COUNT = 0;
                    }
                    this.props.updateEntity(updatedEntities);
                    console.log('details: ', this.props.entities);

                    const dealPromise = this.props.getDealList(
                        {"ASSIGNED_BY_ID": "ASC", "DATE_CREATE": "ASC"},
                        {
                            "ASSIGNED_BY_ID": usersIds,
                            /*   "CLOSED": 'Y' ,
               ">=DATE_MODIFY": yesterday,
               "<DATE_MODIFY": today */
                        }
                        ,
                        ["ID", "TITLE", "OPPORTUNITY", "ASSIGNED_BY_ID"]
                    );
                    dealPromise.then(result => {
                        let updatedEntities = {...this.props.entities};
                        let data = result.data();

                        for (let indexDeal in data) {
                            const idUser = data[indexDeal].ASSIGNED_BY_ID;
                            updatedEntities[idUser].SUM += parseFloat(data[indexDeal].OPPORTUNITY);
                            updatedEntities[idUser].DEAL_COUNT++;
                        }
                        this.props.updateEntity(updatedEntities);
                        console.log('deals: ', this.props.entities);
                        this.props.loadingStatus(false);
                    })
                })
            } else {
                console.log('Data is empty');
                this.props.loadingStatus(false);
            }
        });
    }

    addUsersRows() {
        return Object.keys(this.props.entities).map((id) => {
            return (
                <UserWithDeals user={this.props.entities[id]} key={id}/>
            )
        })
    }

    render() {
        return (
            <div className="container-fluid">
                <div className="bs-callout bs-callout-danger">
                    <h4>Рейтинг по продажам <span id="rating-date"/></h4>
                    <CurrentUser/>
                </div>
                <div className="row">
                    <div className="col-md-5 col-sm-6">
                        <div className="card text-white bg-success">
                            <div className="card-header">
                                <h3 className="card-title">Участники рейтинга</h3>
                            </div>
                            <div className="card-body" style={{padding: 0}}>
                                <div className="list-group"/>
                                {!this.props.loading && Object.keys(this.props.entities).length > 0
                                    ? this.addUsersRows()
                                    : <i className="fa fa-spinner fa-spin"/>}                            </div>
                        </div>
                    </div>
                    <div className="col-md-5 col-sm-6">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Мой результат</h3>
                            </div>
                            <div className="card-body">
                                <div className="list-group"/>
                                <i className="fa fa-spinner fa-spin"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        entities: state.entityReducer.entities,
        loading: state.entityReducer.loading,
    }
}


function mapDispatchToProps(dispatch) {
    return {
        getEntities: (entityName, sort) => dispatch(getEntities(entityName, sort)),
        getUserByParameter: (parameterWithValues) => dispatch(getUserByParameter(parameterWithValues)),
        saveEntity: (id, entity) => dispatch(saveEntity(id, entity)),
        updateEntity: (entities) => dispatch(updateEntity(entities)),
        getDealList: (order, filter, select) => dispatch(getDealList(order, filter, select)),
        loadingStatus: (isLoading) => dispatch(loadingStatus(isLoading)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SalesRating);