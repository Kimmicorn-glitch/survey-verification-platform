package com.backofficepro.surveyplatform.identity.application.mapper;

import com.backofficepro.surveyplatform.identity.application.dto.request.RegisterUserRequest;
import com.backofficepro.surveyplatform.identity.application.dto.response.UserResponse;
import com.backofficepro.surveyplatform.identity.domain.User;
import com.backofficepro.surveyplatform.identity.domain.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * MapStruct mapper for converting between User domain entities and DTOs.
 *
 * @author BackOffice Pro
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    /**
     * Maps a registration request to a User domain entity.
     * Note: password hashing is handled by the service layer.
     *
     * @param request the registration request
     * @return the User entity (without password hash)
     */
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "email", source = "email")
    @Mapping(target = "firstName", source = "firstName")
    @Mapping(target = "lastName", source = "lastName")
    @Mapping(target = "phoneNumber", source = "phoneNumber")
    User toDomain(RegisterUserRequest request);

    /**
     * Maps a User domain entity to a UserResponse DTO.
     *
     * @param user the User entity
     * @return the UserResponse DTO
     */
    @Mapping(target = "roles", source = "roles", qualifiedByName = "mapRolesToStrings")
    UserResponse toResponse(User user);

    /**
     * Updates a User entity from an UpdateUserProfileRequest.
     *
     * @param request the update request
     * @param user    the User entity to update
     */
    void updateFromRequest(RegisterUserRequest request, @MappingTarget User user);

    /**
     * Converts a set of Role entities to a set of role name strings.
     *
     * @param roles the set of Role entities
     * @return the set of role name strings
     */
    @Named("mapRolesToStrings")
    default Set<String> mapRolesToStrings(final Set<Role> roles) {
        if (roles == null) {
            return Set.of();
        }
        return roles.stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
    }
}
