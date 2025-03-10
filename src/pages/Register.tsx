//@ts-nocheck
import { BreadcrumbGroup, Button, CollectionPreferences, Container, Header, Pagination, SpaceBetween, Table, Modal, PropertyFilter } from "@cloudscape-design/components";
import { AppApi } from "../common/AppApi";
import { StorageImage } from '@aws-amplify/ui-react-storage';
import { useEffect, useState } from "react";
import { AppUtility, ProcessActionEnum, UserStateEnum, ProcessActionTypeEnum } from "../common/Util";
import outputs from "../../amplify_outputs.json";

const bucketName = outputs.storage.bucket_name;
function Register() {
    const [userList, setUserList] = useState([]);
    const [filterUserList, setFilterUserList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [query, setQuery] = useState({ tokens: [], operation: "and" });
    const [filteringOption, setFilteringOption] = useState([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalPages, setTotalPages] = useState(0);
    const [isImageVisible, setIsImageVisible] = useState(false);
    const [isGarmentVisible, setIsGarmentVisible] = useState(false);
    const [isProcessedImageVisible, setIsProcessedImageVisible] = useState(false);
    const [userSelectedImagePath, setUserSelectedImagePath] = useState("");
    const [userSelectedGarment, setUserSelectedGarment] = useState("");
    const [userSelectedProcessedImage, setUserSelectedProcessedImage] = useState("");

    const calculatePagination = (productList) => {
        if (productList != null) {
            const totalPages = Math.ceil(productList.length / pageSize);
            setTotalPages(totalPages);
        }
    }

    const contentByPagesize = () => {
        if (filterUserList != null) {
            const startIndex = (currentPageIndex - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            return filterUserList.slice(startIndex, endIndex);
        }
    }

    const getFilteringOption = (users) => {
        const option = [];
        const states = [];
        if (users) {
            users.map((item) => {
                option.push({ propertyKey: "email", value: item.email });
                if (!states.includes(item.process_state))
                    states.push(item.process_state)
            })
        } else {
            userList.map((item) => {
                option.push({ propertyKey: "email", value: item.email })
                if (!states.includes(item.process_state))
                    states.push(item.process_state)
            })
        }
        states.map((item) => {
            option.push({ propertyKey: "process_state", value: item })
        })
        setFilteringOption(option)
    }

    useEffect(() => {
        calculatePagination(filterUserList);
        setCurrentPageIndex(1);
    }, [filterUserList, userList, pageSize])


    const getUsers = async () => {
        const userList = await AppApi.dbGetOperation();
        setUserList(userList);
        setFilterUserList(userList);
        calculatePagination(userList);
        getFilteringOption(userList);
    }

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await getUsers();
            setIsLoading(false);
        }
        init();
    }, [])

    const registerUser = async () => {
        const useremail = window.prompt("Please enter your email", "user@email.com");
        if (useremail) {
            setIsLoading(true);
            const userId = AppUtility.guid()
            let payload = AppUtility.generateUserPayload();
            payload.user_id = userId;
            payload.email = useremail;
            await AppApi.dbPostOperation({
                "action": ProcessActionEnum.ADD_USER,
                "data": payload
            });
            await getUsers();
            setIsLoading(false);
        }
    }

    const sendMail = async (item) => {
        await AppApi.dbPostOperation({
            "action": ProcessActionEnum.SEND_IMAGE,
            "data": { "email": item.email }
        })
    }

    const showSelectedImage = (item) => {
        setUserSelectedImagePath(item.selected_image)
        setIsImageVisible(true)
    }

    const showSelectedGarment = (item) => {
        setUserSelectedGarment(item.selected_garment);
        setIsGarmentVisible(true);
    }

    const showSelectedProcessedImage = (item) => {
        setUserSelectedProcessedImage(item.processed_image);
        setIsProcessedImageVisible(true);
    }

    const initProcess = async (item) => {
        setIsLoading(true)
        let tempUser = item;
        tempUser.process_state = UserStateEnum.IMAGE_PROCESSING;
        tempUser.update_on = new Date().toISOString();
        await AppApi.dbPostOperation({
            "action": ProcessActionEnum.UPDATE_USER,
            "action_type": ProcessActionTypeEnum.SELECTED_USER_IMAGE,
            "data": tempUser
        })

        AppApi.confyOperation({
            "model_s3_uri": `s3://${bucketName}/${item.selected_image}`,
            "garment_s3_uri": `s3://${bucketName}/garments/${item.selected_garment}`,
            "output_bucket_name": bucketName,
            "email_id": item.email
        })
        await getUsers();
        setIsLoading(false)
    }

    const advanceFilter = (detail) => {
        const query = detail;
        const queryTokens = detail.tokenGroups;
        if (queryTokens.length > 0) {
            const userEmails = queryTokens.map((token) => (token.propertyKey == "email" ? token.value : null)).filter((token) => token !== null);
            const states = queryTokens.map((token) => (token.propertyKey == "process_state" ? token.value : null)).filter((token) => token !== null);
            let filteredUserList
            if (query.tokenGroups.length == 2) {
                if (query.operation == "and")
                    filteredUserList = userList.filter((item) => userEmails.includes(item.email) && states.includes(item.process_state));
                else
                    filteredUserList = userList.filter((item) => userEmails.includes(item.email) || states.includes(item.process_state));
            } else {
                if(userEmails.length > 0)
                    filteredUserList = userList.filter((item) => userEmails.includes(item.email));
                if(states.length > 0)
                    filteredUserList = userList.filter((item) => states.includes(item.process_state));
            }
            setFilterUserList(filteredUserList);
        } else {
            setFilterUserList(userList)
        }
        setQuery(query)
    }
    return (
        <Container fitHeight header={
            <BreadcrumbGroup
                items={[
                    { text: "Home", href: "#" },
                    { text: "Registration", href: "/registration" },
                ]}
            />
        }>
            <Table
                loading={isLoading}
                sortingDescending
                sortingDisabled
                stripedRows
                stickyHeader
                wrapLines
                variant="embedded"
                contentDensity="comfortable"
                columnDefinitions={[
                    {
                        id: "email",
                        header: "Email",
                        cell: e => e.email,
                        isRowHeader: true,
                    },
                    {
                        id: "user_id",
                        header: "User ID",
                        cell: e => e.user_id,
                    },
                    {
                        id: "process_state",
                        header: "Process State",
                        cell: e => e.process_state,
                    },
                    {
                        id: "selected_image",
                        header: "Selected Image",
                        cell: e => e.selected_image,
                    },
                    {
                        id: "create_on",
                        header: "Create On",
                        cell: e => e.create_on,
                    },
                    {
                        id: "update_on",
                        header: "Update On",
                        cell: e => AppUtility.isoToLocalTime(e.update_on),
                    },
                    {
                        id: "action",
                        minWidth: 130,
                        header: "",
                        cell: e => (<SpaceBetween size="s" direction="horizontal">
                            <Button iconName="user-profile-active" onClick={() => { showSelectedImage(e) }} disabled={e.selected_image == ""} />
                            <Button iconName="map" onClick={() => { showSelectedGarment(e) }} disabled={e.selected_garment == ""} />
                            <Button iconName="full-screen" onClick={() => { showSelectedProcessedImage(e) }} disabled={e.processed_image == ""} />
                            <Button iconName="settings" onClick={() => { initProcess(e) }} disabled={e.selected_garment == "" || e.selected_image == ""} />
                            <Button iconName="send" onClick={() => { sendMail(e) }} disabled={e.processed_image == ""} />
                        </SpaceBetween>),
                    }
                ]}
                columnDisplay={[
                    { id: "email", visible: true },
                    { id: "user_id", visible: true },
                    { id: "process_state", visible: true },
                    { id: "selected_image", visible: false },
                    { id: "create_on", visible: false },
                    { id: "update_on", visible: true },
                    { id: "action", visible: true }
                ]}
                items={contentByPagesize()}
                loadingText="Loading users"
                filter={
                    <PropertyFilter
                        onChange={({ detail }) => advanceFilter(detail)}
                        virtualScroll
                        enableTokenGroups
                        expandToViewport
                        filteringAriaLabel="Find User"
                        filteringPlaceholder="Find Users"
                        filteringProperties={[
                            {
                                key: "email",
                                operators: ["="],
                                propertyLabel: "Email",
                                groupValuesLabel: "Email values",
                                group: "key"
                            },
                            {
                                key: "process_state",
                                operators: ["="],
                                propertyLabel: "State",
                                groupValuesLabel: "States",
                                group: "key"
                            }
                        ]}
                        query={query}
                        filteringOptions={filteringOption}
                        i18nStrings={{
                            filteringAriaLabel: "your choice",
                            dismissAriaLabel: "Dismiss",
                            filteringOperatorLessThan: "Less than",
                            filteringOperatorLessThanOrEqualTo: "Less than or equal",
                            filteringOperatorGreaterThan: "Greater than",
                            filteringOperatorGreaterThanOrEqualTo: "Greater than or equal",
                            filteringOperatorContains: "Contains",
                            filteringOperatorDoesNotContain: "Does not contain",
                            filteringOperatorEquals: "Equals",
                            filteringOperatorDoesNotEqual: "Does not equal",
                            editTokenHeader: "Edit filter",
                            groupValuesLabel: "Group values",
                            propertyLabel: "Property",
                            operatorLabel: "Operator",
                            valueLabel: "Value",
                            cancelActionText: "Cancel",
                            applyActionText: "Apply",
                            allPropertiesLabel: "All properties",
                            tokenLimitShowMore: "Show more",
                            tokenLimitShowFewer: "Show fewer",
                            clearFilters: "Clear filters",
                            removeTokenButtonAriaLabel: token => `Remove ${token.property} ${token.operator} ${token.value}`,
                            enteredTextLabel: text => `Use: "${text}"`,
                            clearAriaLabel: "Clear",
                            clearFiltersText: "Clear filters",
                            groupPropertiesText: "Attributes",
                            filteringPlaceholder: "Find Solutions",
                            groupValuesText: "Values",
                            operatorText: "Operator",
                            valueText: "Value",
                            operationAndText: "and",
                            operationOrText: "or",
                            operatorLessText: "Less than",
                            operatorLessOrEqualText: "Less than or equal",
                            operatorGreaterText: "Greater than",
                            operatorGreaterOrEqualText: "Greater than or equal",
                            operatorContainsText: "Contains",
                            operatorDoesNotContainText: "Does not contain",
                            operatorEqualsText: "Equals",
                            operatorDoesNotEqualText: "Does not equal",
                        }}

                    />
                }
                header={
                    <Header
                        actions={<Button variant="primary" onClick={() => { registerUser() }}>
                            Register User
                        </Button>}
                    >
                        {userList && `User Registration ${(userList.length > 0 ? `(${userList.length})` : "")}`}
                    </Header>
                }
                pagination={
                    <Pagination currentPageIndex={currentPageIndex} pagesCount={totalPages} onChange={({ detail }) => { setCurrentPageIndex(detail.currentPageIndex) }} />
                }
                preferences={
                    <CollectionPreferences
                        title="Preferences"
                        confirmLabel="Confirm"
                        cancelLabel="Cancel"
                        preferences={{
                            pageSize: pageSize,
                        }}
                        onConfirm={({ detail }) => {
                            setPageSize(detail.pageSize);
                            calculatePagination(userList);
                            setCurrentPageIndex(1);
                        }}
                        pageSizePreference={{
                            title: "Page size",
                            options: [
                                { value: 50, label: "50 resources" },
                                { value: 100, label: "100 resources" }
                            ]
                        }}
                    />
                }
            />

            <Modal visible={isImageVisible} onDismiss={() => {
                setIsImageVisible(false)
            }}>
                {userSelectedImagePath != "" && <StorageImage alt="alt text" path={userSelectedImagePath} />}
            </Modal>

            <Modal visible={isGarmentVisible} onDismiss={() => {
                setIsGarmentVisible(false)
            }}>
                <StorageImage alt="alt text" path={`garments/${userSelectedGarment}`} />
            </Modal>

            <Modal visible={isProcessedImageVisible} onDismiss={() => {
                setIsProcessedImageVisible(false)
            }}>
                {userSelectedProcessedImage != "" && <StorageImage alt="alt text" path={userSelectedProcessedImage} />}
            </Modal>

        </Container>
    );

}

export default Register;