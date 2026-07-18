package com.backofficepro.surveyplatform.identity.infrastructure.security;

import com.backofficepro.surveyplatform.identity.domain.User;
import com.backofficepro.surveyplatform.identity.domain.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

/**
 * Spring Security UserDetailsService implementation that loads user data
 * from the identity domain's user repository.
 *
 * @author BackOffice Pro
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Constructs a new CustomUserDetailsService.
     *
     * @param userRepository the user repository
     */
    public CustomUserDetailsService(final UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(final String username) throws UsernameNotFoundException {
        final User user = userRepository.findByEmail(username.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with email: " + username));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                user.isActive(),
                true,
                true,
                !user.isAccountLocked(),
                user.getRoles().stream()
                        .flatMap(role -> role.getPermissions().stream()
                                .map(permission -> new SimpleGrantedAuthority(
                                        permission.getName())))
                        .collect(Collectors.toList()));
    }
}
