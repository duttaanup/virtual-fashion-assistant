//@ts-nocheck
import { BreadcrumbGroup, Button, CollectionPreferences, Container, Header, Pagination, SpaceBetween, Table, TextFilter, Modal, PropertyFilter } from "@cloudscape-design/components";
import { AppApi } from "../common/AppApi";
import { StorageImage } from '@aws-amplify/ui-react-storage';
import { useEffect, useState } from "react";
import { AppUtility, UserState } from "../common/Util";

export default function Register() {
    const [userList, setUserList] = useState([]);
    const [filterUserList, setFilterUserList] = useState([]);
    const [isLoading,setIsLoading] = useState(false);
    const [query, setQuery] = useState({ tokens: [], operation: "and" });
    const [filteringOption, setFilteringOption] = useState([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isImageVisible, setIsImageVisible] = useState(false);
    const [isGarmentVisible, setIsGarmentVisible] = useState(false);
    const [isProcessedImageVisible, setIsProcessedImageVisible] = useState(false);
    const [userSelectedImagePath, setUserSelectedImagePath] = useState("");
    const [userSelectedGarment, setUserSelectedGarment] = useState("");
    const [userSelectedProcessedImage, setUserSelectedProcessedImage] = useState("");

    const calculatePagination = (productList) => {
        const totalPages = Math.ceil(productList.length / pageSize);
        setTotalPages(totalPages);
    }

    const contentByPagesize = () => {
        const startIndex = (currentPageIndex - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filterUserList.slice(startIndex, endIndex);
    }

    const getFilteringOption = (users) => {
        const option = [];
        if (users) {
            users.map((item) => {
                option.push({ propertyKey: "email", value: item.email })
            })
        } else {
            userList.map((item) => {
                option.push({ propertyKey: "email", value: item.email })
            })
        }
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
                "action": "ADD_USER",
                "data": payload
            });
            await getUsers();
            setIsLoading(false);
        }
    }

    const sendMail = async (item) => {
        await AppApi.dbPostOperation({
            "action": "SEND_IMAGE",
            "data": {"email": item.email}
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

    const advanceFilter = (detail) => {
        const query = detail;
        const queryTokens = detail.tokenGroups;
        console.log(queryTokens)
        if (queryTokens.length > 0) {
            const userEmails = queryTokens.map((token) => (token.propertyKey == "email" ? token.value : null)).filter((token) => token !== null);
            const filteredUserList = userList.filter((item) => userEmails.includes(item.email));
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
                        minWidth: 120,
                        header: "",
                        cell: e => (<SpaceBetween size="s" direction="horizontal">
                            <Button iconName="user-profile-active" onClick={() => { showSelectedImage(e) }} disabled={e.selected_image == ""} />
                            <Button iconName="map" onClick={() => { showSelectedGarment(e) }} disabled={e.selected_garment == ""} />
                            <Button iconName="full-screen" onClick={() => { showSelectedProcessedImage(e) }} disabled={e.processed_image == ""} />
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
                            }
                        ]}
                        query={query}
                        filteringOptions={filteringOption}
                        i18nStrings={
                            {
                                filteringAriaLabel: "your choice",
                                dismissAriaLabel: "Dismiss",
                                clearAriaLabel: "Clear",
                                clearFiltersText: "Clear filters",
                                groupPropertiesText: "Attributes",
                                filteringLabel: "Filtering",
                                filteringPlaceholder: "Find Solutions",
                                groupValuesText: "Values",
                                operatorText: "Operator",
                                operationText: "Operation",
                                valueText: "Value",
                                cancelActionText: "Cancel",
                                applyActionText: "Apply",
                                logicalOperatorText: "and",
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
                                editTokenHeader: "Edit filter"
                            }
                        }
                    />
                }
                header={
                    <Header
                        actions={<Button variant="primary" onClick={() => { registerUser() }}>
                            Register User
                        </Button>}
                    >
                        User Registration {(userList.length > 0 ? `(${userList.length})`: "")}
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
                                { value: 10, label: "10 resources" },
                                { value: 20, label: "20 resources" },
                                { value: 30, label: "30 resources" },
                                { value: 40, label: "40 resources" },
                                { value: 50, label: "50 resources" }
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
                <img width="100%" src={`./garments/${userSelectedGarment}`} />
            </Modal>

            <Modal visible={isProcessedImageVisible} onDismiss={() => {
                setIsProcessedImageVisible(false)
            }}>
                {userSelectedProcessedImage != "" && <StorageImage alt="alt text" path={userSelectedProcessedImage} />}
            </Modal>

        </Container>
    );

}